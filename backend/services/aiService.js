const { GoogleGenerativeAI } = require('@google/generative-ai');

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

function buildPrompt(topic, wikipediaContext) {
  return `You are an expert quiz author. Generate exactly 5 multiple-choice questions about the topic: "${topic}".

Use the following Wikipedia-derived context as the primary factual basis. If context is thin, still ensure factual accuracy.

--- CONTEXT START ---
${wikipediaContext || '(no context)'}
--- CONTEXT END ---

Strict requirements:
- Exactly 5 questions.
- Each question: 4 options labeled A, B, C, D (strings).
- Exactly one correct answer per question: correct must be "A", "B", "C", or "D".
- Include a clear explanation for why the correct answer is right.

Return ONLY valid JSON, no markdown, no code fences, no commentary. Shape:
{"questions":[{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correct":"A","explanation":"..."}]}`;
}

function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function validateQuizPayload(data) {
  if (!data || !Array.isArray(data.questions)) {
    return { ok: false, error: 'Missing questions array' };
  }
  if (data.questions.length !== 5) {
    return {
      ok: false,
      error: `Expected 5 questions, got ${data.questions.length}`,
    };
  }

  const normalized = [];
  for (let i = 0; i < data.questions.length; i++) {
    const q = data.questions[i];
    if (!q.question || typeof q.options !== 'object') {
      return { ok: false, error: `Invalid question at index ${i}` };
    }
    const opts = {};
    for (const k of OPTION_KEYS) {
      const v = q.options[k] ?? q.options[k.toLowerCase()];
      if (!v || typeof v !== 'string' || !v.trim()) {
        return { ok: false, error: `Question ${i + 1} missing option ${k}` };
      }
      opts[k] = v.trim();
    }
    const correct = String(q.correct || '').toUpperCase().trim();
    if (!OPTION_KEYS.includes(correct)) {
      return { ok: false, error: `Question ${i + 1} invalid correct answer` };
    }
    normalized.push({
      question: String(q.question).trim(),
      options: opts,
      correct,
      explanation: String(q.explanation || 'Correct by definition.').trim(),
    });
  }
  return { ok: true, questions: normalized };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isQuotaOrRateLimit(e) {
  const m = String(e?.message || '').toLowerCase();
  return (
    m.includes('429') ||
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('too many requests') ||
    m.includes('resource exhausted')
  );
}

function retryAfterSeconds(message) {
  const m = String(message || '').match(/retry in ([\d.]+)s/i);
  const sec = (m ? Number.parseFloat(m[1]) : 12) + 1.5;
  return Math.min(90, Math.max(6, sec));
}

async function generateQuiz(topic, wikipediaContext) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY is not configured');
    err.code = 'GEMINI_CONFIG';
    throw err;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const ctxMax = Number(process.env.GEMINI_CONTEXT_MAX_CHARS) || 3200;
  const ctx = String(wikipediaContext || '').slice(0, ctxMax);
  const prompt = buildPrompt(topic, ctx);

  const selectedModelName =
    process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash-lite';

  const generationConfig = {
    temperature: 0.4,
    maxOutputTokens: 4096,
  };

  let text;
  let lastError = null;
  let selectedModel = null;
  let selectedJsonMode = null;
  const maxWaitRounds = Number(process.env.GEMINI_QUOTA_RETRY_ROUNDS) || 4;

  done: for (let round = 0; round < maxWaitRounds; round++) {
    if (round > 0 && lastError && isQuotaOrRateLimit(lastError)) {
      const waitSec = retryAfterSeconds(lastError.message);
      console.warn(
        `[aiService] Quota/rate limit — waiting ${waitSec}s before retry round ${round + 1}/${maxWaitRounds}`
      );
      await sleep(waitSec * 1000);
    }

    for (const useJsonMime of [true, false]) {
      try {
        const model = genAI.getGenerativeModel({
          model: selectedModelName,
          generationConfig: {
            ...generationConfig,
            ...(useJsonMime ? { responseMimeType: 'application/json' } : {}),
          },
        });
        const result = await model.generateContent(prompt);
        text = result.response.text();
        selectedModel = selectedModelName;
        selectedJsonMode = useJsonMime;
        break done;
      } catch (e) {
        lastError = e;
        const msg = (e.message || '').toLowerCase();

        const jsonModeRejected =
          useJsonMime &&
          (msg.includes('responsemimetype') ||
            msg.includes('mime type') ||
            msg.includes('json mode') ||
            msg.includes('unsupported'));
        if (jsonModeRejected) continue;

        if (isQuotaOrRateLimit(e)) continue;

        const err = new Error(
          `${e.message} — If this is quota-related, check GEMINI_MODEL / billing: https://ai.google.dev/gemini-api/docs/rate-limits`
        );
        err.code = 'GEMINI_API';
        err.cause = e;
        throw err;
      }
    }
  }

  if (text == null) {
    const err = new Error(
      `Gemini quota or rate limit: all models failed after ${maxWaitRounds} wait/retry rounds. ` +
        `Try: (1) Wait 1–2 minutes and generate again. (2) Set GEMINI_MODEL=gemini-2.5-flash-lite in .env. ` +
        `(3) Enable billing in Google AI Studio for higher limits. https://ai.google.dev/gemini-api/docs/rate-limits — Last: ${lastError?.message || 'unknown'}`
    );
    err.code = 'GEMINI_QUOTA';
    err.cause = lastError;
    throw err;
  }

  const parsed = extractJson(text);
  const validated = validateQuizPayload(parsed);
  if (!validated.ok) {
    const err = new Error(validated.error || 'Invalid AI response structure');
    err.code = 'GEMINI_PARSE';
    err.rawPreview = text?.slice(0, 500);
    throw err;
  }
  return { questions: validated.questions };
}

module.exports = { generateQuiz };

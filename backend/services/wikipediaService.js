const axios = require('axios');

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const USER_AGENT = 'QuizBuilderMVP/1.0 (educational)';
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_EXTRACT_CHARS = 3500;

async function fetchContext(topic) {
  const search = String(topic || '').trim();
  if (!search) {
    return { title: '', extract: '', sourceUrl: '' };
  }

  try {
    const searchUrl = `${WIKI_API}?action=query&format=json&list=search&srsearch=${encodeURIComponent(
      search
    )}&srlimit=1&origin=*`;
    const { data: searchData } = await axios.get(searchUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
    });
    const hits = searchData?.query?.search;
    if (!hits?.length) {
      return {
        title: search,
        extract: `No Wikipedia article found for "${search}". Generate questions from general knowledge about this topic.`,
        sourceUrl: '',
      };
    }

    const title = hits[0].title;
    const extractUrl = `${WIKI_API}?action=query&format=json&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(
      title
    )}&origin=*`;
    const { data: pageData } = await axios.get(extractUrl, {
      timeout: REQUEST_TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
    });
    const pages = pageData?.query?.pages;
    const page = pages && Object.values(pages)[0];
    const extract = page?.extract || '';
    const trimmed =
      extract.length > MAX_EXTRACT_CHARS
        ? `${extract.slice(0, MAX_EXTRACT_CHARS)}…`
        : extract;

    return {
      title,
      extract:
        trimmed || `Brief article. Topic: ${title}. Use accurate general knowledge.`,
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    };
  } catch (err) {
    const message = err.response?.status
      ? `Wikipedia HTTP ${err.response.status}`
      : err.message;
    console.warn('[wikipediaService]', message);
    return {
      title: search,
      extract: `Wikipedia unavailable (${message}). Generate 5 accurate multiple-choice questions about "${search}" from well-established facts.`,
      sourceUrl: '',
      degraded: true,
    };
  }
}

module.exports = { fetchContext };

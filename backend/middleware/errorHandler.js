const STATUS_BY_CODE = {
  AUTH_INVALID: 401,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  VALIDATION: 400,
  GEMINI_PARSE: 400,
  DATA_ERROR: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  PAYLOAD_TOO_LARGE: 413,
  GEMINI_CONFIG: 503,
  GEMINI_API: 502,
  GEMINI_QUOTA: 429,
  DB_UNAVAILABLE: 503,
  AUTH_CONFIG: 503,
  INTERNAL_ERROR: 500,
};

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  // Body-parser errors (malformed JSON, oversized payloads).
  if (err.type === 'entity.parse.failed') {
    code = 'VALIDATION';
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  }

  // MySQL driver errors.
  if (code === 'ER_ACCESS_DENIED_ERROR' || code === 'ECONNREFUSED' || code === 'ENOTFOUND') {
    code = 'DB_UNAVAILABLE';
    message =
      'Database unavailable. Check MYSQL_* settings in .env, ensure MySQL is running, and that the database exists (run database/schema.sql).';
  } else if (code === 'ER_DUP_ENTRY') {
    code = 'CONFLICT';
    message = 'A record with these details already exists';
  }

  if (!STATUS_BY_CODE[code]) code = 'INTERNAL_ERROR';
  const status = STATUS_BY_CODE[code];
  const isProd = process.env.NODE_ENV === 'production';

  // 5xx details belong in server logs, not in responses.
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} -> ${code}:`, err);
    if (isProd) {
      message =
        status === 503 || status === 502
          ? 'Service temporarily unavailable. Please try again later.'
          : 'Internal server error';
    }
  }

  const clientCode = code === 'AUTH_INVALID' ? 'UNAUTHORIZED' : code;

  const body = {
    success: false,
    error: { code: clientCode, message },
  };
  if (!isProd && err.rawPreview) {
    body.error.rawPreview = err.rawPreview;
  }
  res.status(status).json(body);
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };

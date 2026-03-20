const STATUS_BY_CODE = {
  AUTH_INVALID: 401,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  VALIDATION: 400,
  GEMINI_PARSE: 400,
  DATA_ERROR: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  GEMINI_CONFIG: 503,
  GEMINI_API: 502,
  GEMINI_QUOTA: 429,
  MYSQL_ACCESS_DENIED: 503,
  AUTH_CONFIG: 503,
  INTERNAL_ERROR: 500,
};

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'Internal server error';

  if (code === 'ER_ACCESS_DENIED_ERROR') {
    code = 'MYSQL_ACCESS_DENIED';
    message =
      'MySQL rejected the connection. Check MYSQL_HOST, MYSQL_USER, and MYSQL_PASSWORD in .env, ensure the server is running, and that the database exists (run database/schema.sql).';
  }

  const status = STATUS_BY_CODE[code] ?? 500;
  const clientCode = code === 'AUTH_INVALID' ? 'UNAUTHORIZED' : code;

  const body = {
    success: false,
    error: { code: clientCode, message },
  };
  if (process.env.NODE_ENV !== 'production' && err.rawPreview) {
    body.error.rawPreview = err.rawPreview;
  }
  res.status(status).json(body);
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = { errorHandler, asyncHandler };

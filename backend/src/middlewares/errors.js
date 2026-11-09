export function notFound(_req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Rota não encontrada.' } });
}

export function errorHandler(error, _req, res, _next) {
  if (!error.type && error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: { code: `HTTP_${error.status}`, message: error.message } });
  }
  if (error.code === 'ER_DUP_ENTRY' || error.code?.includes('SQLITE_CONSTRAINT_UNIQUE')) {
    return res
      .status(409)
      .json({ error: { code: 'CONFLICT', message: 'Já existe um registro com esses dados.' } });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'JSON inválido.' } });
  }
  if (error.type === 'entity.too.large') {
    return res
      .status(413)
      .json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Corpo da requisição excede o limite.' } });
  }
  console.error('Erro interno na requisição:', error.name);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor.' } });
}

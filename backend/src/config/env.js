export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3001),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
};
if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
  throw new Error('PORT deve ser um inteiro entre 1 e 65535.');
}

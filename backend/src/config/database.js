export function databaseOptions(source = process.env) {
  let address;
  if (source.DATABASE_URL) {
    try { address = new URL(source.DATABASE_URL); }
    catch { throw new Error('DATABASE_URL inválida.'); }
    if (address.protocol !== 'mysql:') throw new Error('DATABASE_URL precisa ser uma conexão MySQL.');
  }
  const options = {
    host: address ? address.hostname : source.DB_HOST,
    port: Number(address?.port || source.DB_PORT || 3306),
    database: address ? decodeURIComponent(address.pathname.slice(1)) : source.DB_NAME,
    user: address ? decodeURIComponent(address.username) : source.DB_USER,
    password: address ? decodeURIComponent(address.password) : source.DB_PASSWORD || ''
  };
  const missing = ['host', 'database', 'user'].filter((key) => !options[key]);
  if (missing.length) throw new Error(`Configuração MySQL incompleta: ${missing.join(', ')}`);
  if (!Number.isInteger(options.port) || options.port < 1 || options.port > 65535) throw new Error('Porta MySQL inválida.');
  return options;
}

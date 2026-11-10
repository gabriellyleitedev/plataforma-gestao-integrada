export function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}
export function text(value, label, { required = true, max = 160 } = {}) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') fail(400, `${label}: informe um texto.`);
  value = value.trim();
  if (required && !value) fail(400, `${label} é obrigatório.`);
  if (value.length > max) fail(400, `${label}: máximo de ${max} caracteres.`);
  return value;
}
export function integer(value, label, min = 0, max = 100000000) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max)
    fail(400, `${label}: informe um inteiro entre ${min} e ${max}.`);
  return value;
}
export function choice(value, options, label) {
  if (!options.includes(value)) fail(400, `${label} inválido.`);
  return value;
}
export function email(value, required = false) {
  const result = text(value, 'E-mail', { required, max: 190 }).toLowerCase();
  if (result && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail(400, 'Informe um e-mail válido.');
  return result;
}
export function identifier(value) {
  const id = typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : value;
  return integer(id, 'Identificador', 1);
}
export const optionalId = (value) =>
  value === null || value === '' || value === undefined ? null : identifier(value);
export function date(value) {
  if (typeof value !== 'string' || !value || !Number.isFinite(new Date(value).getTime()))
    fail(400, 'Data inválida.');
  return new Date(value).toISOString();
}
export async function reference(one, table, id, label, companyId) {
  if (
    id !== null &&
    !(await one(`SELECT id FROM ${table} WHERE id = ? AND company_id = ? AND archived = 0`, [id, companyId]))
  )
    fail(400, `${label} não encontrado ou arquivado.`);
}

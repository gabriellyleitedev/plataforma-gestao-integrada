import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { scrypt } from 'node:crypto';
import { one, query, insert, transaction, driver } from '../database/store.js';
import { text, email, choice, fail } from './validation.js';

const derive = promisify(scrypt);
const publicUser = ({ id, name, email, role, active, company_name }) => ({
  id,
  name,
  email,
  role,
  active: Boolean(active),
  ...(company_name ? { company: company_name } : {})
});
const userWithCompany =
  'SELECT u.*, c.name AS company_name FROM users u JOIN companies c ON c.id = u.company_id';
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const dummySalt = randomBytes(16).toString('hex');
const dummyHash = `${dummySalt}:${scryptSync(randomBytes(32), dummySalt, 64).toString('hex')}`;
export async function verifyPassword(password, passwordHash) {
  if (typeof password !== 'string' || !password.length || password.length > 128)
    fail(400, 'Informe uma senha de até 128 caracteres.');
  const [salt, expected] = (passwordHash || dummyHash).split(':');
  const actual = await derive(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 10 || password.length > 128)
    fail(400, 'A senha deve ter entre 10 e 128 caracteres.');
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await derive(password, salt, 64)).toString('hex')}`;
}

export async function createUser(data, companyId) {
  const fields = {
    company_id: companyId,
    name: text(data.name, 'Nome'),
    email: email(data.email, true),
    role: choice(data.role, ['admin', 'manager', 'operator'], 'Perfil'),
    password_hash: await hashPassword(data.password),
    active: 1,
    created_at: new Date().toISOString()
  };
  if (await one('SELECT id FROM users WHERE email = ?', [fields.email]))
    fail(409, 'Este e-mail já está cadastrado.');
  const id = await insert('users', fields);
  return publicUser({ ...fields, id });
}

export async function status() {
  return { storage: driver };
}
export async function register(data) {
  const company = text(data.company, 'Nome do negócio');
  return transaction(async () => {
    const companyId = await insert('companies', { name: company, created_at: new Date().toISOString() });
    return createUser({ ...data, role: 'admin' }, companyId);
  });
}
const attempts = new Map();
export async function login(data, ip) {
  const address = email(data.email, true);
  const key = `${ip}:${address}`;
  const now = Date.now();
  for (const [entry, value] of attempts) if (value.until < now) attempts.delete(entry);
  const attempt = attempts.get(key);
  if (attempt?.count >= 10) fail(429, 'Muitas tentativas. Aguarde 15 minutos.');
  const user = await one(`${userWithCompany} WHERE u.email = ?`, [address]);
  const valid = await verifyPassword(data.password, user?.password_hash);
  if (!user || !user.active || !valid) {
    attempts.set(key, { count: (attempt?.count || 0) + 1, until: attempt?.until || now + 900000 });
    fail(401, 'E-mail ou senha inválidos.');
  }
  attempts.delete(key);
  const token = randomBytes(32).toString('hex');
  await query('DELETE FROM sessions WHERE expires_at < ?', [new Date().toISOString()]);
  await insert('sessions', {
    token_hash: hashToken(token),
    user_id: user.id,
    expires_at: new Date(now + 8 * 3600000).toISOString()
  });
  return { token, user: publicUser(user) };
}
export async function authenticate(req, _res, next) {
  try {
    const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!token) fail(401, 'Entre na sua conta para continuar.');
    const user = await one(
      `${userWithCompany} JOIN sessions s ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1`,
      [hashToken(token), new Date().toISOString()]
    );
    if (!user) fail(401, 'Sessão expirada. Entre novamente.');
    req.user = publicUser(user);
    req.companyId = user.company_id;
    req.tokenHash = hashToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
export function permit(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role))
      return next(Object.assign(new Error('Seu perfil não tem permissão para esta ação.'), { status: 403 }));
    next();
  };
}
export { publicUser };

import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { scrypt } from 'node:crypto';
import { one, query, insert, transaction, lock, driver } from '../database/store.js';
import { text, email, choice, fail } from './validation.js';

const derive = promisify(scrypt);
const publicUser = ({ id, name, email, role, active }) => ({
  id,
  name,
  email,
  role,
  active: Boolean(active)
});
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

export async function createUser(data) {
  const fields = {
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

export async function setupStatus() {
  return { needsSetup: !(await one('SELECT id FROM users LIMIT 1')), storage: driver };
}
export async function setup(data) {
  return transaction(async () => {
    await one(`SELECT id FROM setup_lock WHERE id = 1${lock}`);
    if ((await setupStatus()).needsSetup === false) fail(409, 'O administrador inicial já foi criado.');
    return createUser({ ...data, role: 'admin' });
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
  const user = await one('SELECT * FROM users WHERE email = ?', [address]);
  // Comparamos o hash também para e-mails inexistentes, reduzindo diferenças de tempo.
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
      'SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.active = 1',
      [hashToken(token), new Date().toISOString()]
    );
    if (!user) fail(401, 'Sessão expirada. Entre novamente.');
    req.user = publicUser(user);
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

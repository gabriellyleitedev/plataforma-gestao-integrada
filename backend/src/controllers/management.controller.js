import { Router } from 'express';
import {
  status,
  register,
  login,
  authenticate,
  permit,
  createUser,
  publicUser,
  hashPassword,
  verifyPassword
} from '../services/auth.service.js';
import { resources, listResource, saveResource, archiveResource } from '../services/resources.service.js';
import {
  stockMovement,
  listMovements,
  createSale,
  listSales,
  saleDetail,
  cancelSale,
  report
} from '../services/business.service.js';
import { one, query, transaction, lock } from '../database/store.js';
import { identifier, text, email, choice, fail } from '../services/validation.js';

export const managementRoutes = Router();
managementRoutes.use((req, _res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    if (req.body === undefined) req.body = {};
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
      return next(Object.assign(new Error('Envie um objeto JSON válido.'), { status: 400 }));
  }
  next();
});
const scope = (req) => ({ userId: req.user.id, companyId: req.companyId });

managementRoutes.get('/status', async (_req, res) => res.json(await status()));
managementRoutes.post('/auth/register', async (req, res) => res.status(201).json(await register(req.body)));
managementRoutes.post('/auth/login', async (req, res) => res.json(await login(req.body, req.ip)));
managementRoutes.use((req, res, next) => {
  if (
    !/^\/(auth\/(me|logout|password)|users|clients|categories|suppliers|items|appointments|stock\/movements|sales|reports)(\/|$)/.test(
      req.path
    )
  )
    return next('router');
  return authenticate(req, res, next);
});
managementRoutes.get('/auth/me', (req, res) => res.json(req.user));
managementRoutes.post('/auth/logout', async (req, res) => {
  await query('DELETE FROM sessions WHERE token_hash = ?', [req.tokenHash]);
  res.json({ message: 'Sessão encerrada.' });
});
managementRoutes.put('/auth/password', async (req, res) => {
  const current = await one('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await verifyPassword(req.body.current_password, current.password_hash)))
    fail(400, 'Senha atual incorreta.');
  const passwordHash = await hashPassword(req.body.password);
  await transaction(async () => {
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);
    await query('DELETE FROM sessions WHERE user_id = ?', [req.user.id]);
  });
  res.json({ message: 'Senha atualizada. Entre novamente.' });
});
managementRoutes.get('/users', permit('admin'), async (req, res) =>
  res.json(
    (
      await query('SELECT id, name, email, role, active FROM users WHERE company_id = ? ORDER BY id', [
        req.companyId
      ])
    ).rows.map(publicUser)
  )
);
managementRoutes.post('/users', permit('admin'), async (req, res) =>
  res.status(201).json(await transaction(() => createUser(req.body, req.companyId)))
);
managementRoutes.put('/users/:id', permit('admin'), async (req, res) => {
  const id = identifier(req.params.id);
  if (typeof req.body.active !== 'boolean') fail(400, 'Informe se o usuário está ativo.');
  const fields = {
    name: text(req.body.name, 'Nome'),
    email: email(req.body.email, true),
    role: choice(req.body.role, ['admin', 'manager', 'operator'], 'Perfil'),
    active: req.body.active === true ? 1 : 0
  };
  if (id === req.user.id && (!fields.active || fields.role !== 'admin'))
    fail(400, 'Você não pode desativar ou remover seu próprio perfil de administrador.');
  const result = await transaction(async () => {
    if (!(await one(`SELECT id FROM users WHERE id = ? AND company_id = ?${lock}`, [id, req.companyId])))
      fail(404, 'Usuário não encontrado.');
    if (await one('SELECT id FROM users WHERE email = ? AND id <> ?', [fields.email, id]))
      fail(409, 'E-mail já cadastrado.');
    await query('UPDATE users SET name = ?, email = ?, role = ?, active = ? WHERE id = ?', [
      ...Object.values(fields),
      id
    ]);
    if (req.body.password)
      await query('UPDATE users SET password_hash = ? WHERE id = ?', [
        await hashPassword(req.body.password),
        id
      ]);
    await query('DELETE FROM sessions WHERE user_id = ?', [id]);
    return { id, ...fields };
  });
  res.json(publicUser(result));
});

for (const resource of resources) {
  const roles = ['clients', 'appointments'].includes(resource)
    ? ['admin', 'manager', 'operator']
    : ['admin', 'manager'];
  managementRoutes.get(`/${resource}`, async (req, res) =>
    res.json(await listResource(resource, scope(req)))
  );
  managementRoutes.post(`/${resource}`, permit(...roles), async (req, res) =>
    res.status(201).json(await saveResource(resource, null, req.body, scope(req)))
  );
  managementRoutes.put(`/${resource}/:id`, permit(...roles), async (req, res) =>
    res.json(await saveResource(resource, identifier(req.params.id), req.body, scope(req)))
  );
  managementRoutes.delete(`/${resource}/:id`, permit(...roles), async (req, res) =>
    res.json(await archiveResource(resource, identifier(req.params.id), scope(req)))
  );
}
managementRoutes.get('/stock/movements', async (req, res) => res.json(await listMovements(scope(req))));
managementRoutes.post('/stock/movements', permit('admin', 'manager'), async (req, res) =>
  res.status(201).json(await stockMovement(req.body, scope(req)))
);
managementRoutes.get('/sales', async (req, res) => res.json(await listSales(scope(req))));
managementRoutes.get('/sales/:id', async (req, res) =>
  res.json(await saleDetail(identifier(req.params.id), scope(req)))
);
managementRoutes.post('/sales', async (req, res) =>
  res.status(201).json(await createSale(req.body, scope(req)))
);
managementRoutes.post('/sales/:id/cancel', permit('admin', 'manager'), async (req, res) =>
  res.json(await cancelSale(identifier(req.params.id), req.body.reason, scope(req)))
);
managementRoutes.get('/reports', async (req, res) =>
  res.json(await report(String(req.query.from || ''), String(req.query.to || ''), scope(req)))
);

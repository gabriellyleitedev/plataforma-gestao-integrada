import { one, query, insert, transaction, lock } from '../database/store.js';
import { text, email, integer, choice, optionalId, date, reference, fail } from './validation.js';

export const resources = ['clients', 'categories', 'suppliers', 'items', 'appointments'];
const cleanNotes = (value) => text(value, 'Observações', { required: false, max: 5000 });
async function fieldsFor(resource, data, user) {
  if (['clients', 'suppliers'].includes(resource)) return {
    name: text(data.name, 'Nome'), email: email(data.email),
    phone: text(data.phone, 'Telefone', { required: false, max: 40 }),
    document: text(data.document, 'Documento', { required: false, max: 40 }), notes: cleanNotes(data.notes)
  };
  if (resource === 'categories') return { name: text(data.name, 'Nome'), description: cleanNotes(data.description) };
  if (resource === 'items') {
    const fields = {
      name: text(data.name, 'Nome'), type: choice(data.type, ['product', 'service'], 'Tipo'),
      sku: text(data.sku, 'Código', { required: false, max: 80 }), description: cleanNotes(data.description),
      price_cents: integer(data.price_cents, 'Preço em centavos', 0, 100000000),
      cost_cents: integer(data.cost_cents ?? 0, 'Custo em centavos', 0, 100000000),
      category_id: optionalId(data.category_id), supplier_id: optionalId(data.supplier_id),
      stock_minimum: integer(data.stock_minimum ?? 0, 'Estoque mínimo', 0, 1000000)
    };
    if (fields.type === 'service') { fields.stock_minimum = 0; fields.supplier_id = null; }
    await reference(one, 'categories', fields.category_id, 'Categoria');
    await reference(one, 'suppliers', fields.supplier_id, 'Fornecedor');
    return fields;
  }
  const fields = {
    client_id: optionalId(data.client_id), subject: text(data.subject, 'Assunto'), notes: cleanNotes(data.notes),
    scheduled_at: date(data.scheduled_at), status: choice(data.status || 'open', ['open', 'in_progress', 'completed', 'cancelled'], 'Status')
  };
  if (!fields.client_id) fail(400, 'Selecione um cliente.');
  await reference(one, 'clients', fields.client_id, 'Cliente');
  if (user) fields.user_id = user.id;
  return fields;
}

export async function listResource(resource) {
  if (resource === 'items') return (await query('SELECT i.*, c.name AS category_name, s.name AS supplier_name FROM items i LEFT JOIN categories c ON c.id = i.category_id LEFT JOIN suppliers s ON s.id = i.supplier_id WHERE i.archived = 0 ORDER BY i.id DESC')).rows;
  if (resource === 'appointments') return (await query('SELECT a.*, c.name AS client_name, u.name AS user_name FROM appointments a JOIN clients c ON c.id = a.client_id JOIN users u ON u.id = a.user_id WHERE a.archived = 0 ORDER BY a.scheduled_at DESC')).rows;
  return (await query(`SELECT * FROM ${resource} WHERE archived = 0 ORDER BY id DESC`)).rows;
}

export async function saveResource(resource, id, data, user) {
  return transaction(async () => {
    let old;
    if (id) {
      old = await one(`SELECT * FROM ${resource} WHERE id = ? AND archived = 0${lock}`, [id]);
      if (!old) fail(404, 'Registro não encontrado.');
    }
    const fields = await fieldsFor(resource, data, resource === 'appointments' && !id ? user : null);
    if (resource === 'items' && old && fields.type !== old.type) {
      if (old.stock || await one('SELECT id FROM sale_items WHERE item_id = ? LIMIT 1', [id]) || await one('SELECT id FROM stock_movements WHERE item_id = ? LIMIT 1', [id])) fail(409, 'Não é possível mudar o tipo de um item com histórico. Cadastre outro item.');
    }
    if (id) {
      await query(`UPDATE ${resource} SET ${Object.keys(fields).map((key) => `${key} = ?`).join(', ')} WHERE id = ?`, [...Object.values(fields), id]);
    } else id = await insert(resource, { ...fields, created_at: new Date().toISOString() });
    return one(`SELECT * FROM ${resource} WHERE id = ?`, [id]);
  });
}

export async function archiveResource(resource, id) {
  return transaction(async () => {
    const old = await one(`SELECT * FROM ${resource} WHERE id = ? AND archived = 0${lock}`, [id]);
    if (!old) fail(404, 'Registro não encontrado.');
    if (resource === 'items' && old.stock !== 0) fail(409, 'Zere o estoque por uma movimentação antes de arquivar o produto.');
    await query(`UPDATE ${resource} SET archived = 1 WHERE id = ?`, [id]);
    return { message: 'Registro arquivado. O histórico foi preservado.' };
  });
}

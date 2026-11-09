import { query, one, insert, transaction, lock } from '../database/store.js';
import { integer, identifier, optionalId, text, choice, fail, reference } from './validation.js';

async function move(item, delta, type, reason, userId, saleId = null) {
  const balance = item.stock + delta;
  if (!Number.isSafeInteger(balance) || balance < 0 || balance > 1000000)
    fail(409, `Estoque insuficiente ou limite excedido para ${item.name}. Saldo atual: ${item.stock}.`);
  await query('UPDATE items SET stock = ? WHERE id = ?', [balance, item.id]);
  await insert('stock_movements', {
    item_id: item.id,
    user_id: userId,
    sale_id: saleId,
    type,
    quantity: delta,
    balance_after: balance,
    reason,
    created_at: new Date().toISOString()
  });
}

export async function stockMovement(data, userId) {
  const id = identifier(data.item_id);
  const type = choice(data.type, ['entry', 'exit', 'adjustment'], 'Movimentação');
  const amount = integer(data.quantity, 'Quantidade', type === 'adjustment' ? 0 : 1, 1000000);
  const reason = text(data.reason, 'Motivo', { max: 500 });
  return transaction(async () => {
    const item = await one(`SELECT * FROM items WHERE id = ? AND archived = 0${lock}`, [id]);
    if (!item || item.type !== 'product')
      fail(400, 'Selecione um produto ativo. Serviços não movimentam estoque.');
    const delta = type === 'adjustment' ? amount - item.stock : type === 'exit' ? -amount : amount;
    if (!delta) fail(400, 'O saldo informado já é o saldo atual.');
    await move(item, delta, type, reason, userId);
    return { message: 'Estoque atualizado.', stock: item.stock + delta };
  });
}

export async function listMovements() {
  return (
    await query(
      'SELECT m.*, i.name AS item_name, u.name AS user_name FROM stock_movements m JOIN items i ON i.id = m.item_id JOIN users u ON u.id = m.user_id ORDER BY m.id DESC'
    )
  ).rows;
}

export async function createSale(data, userId) {
  const clientId = optionalId(data.client_id);
  const payment = choice(data.payment_method, ['pix', 'cash', 'credit', 'debit', 'other'], 'Pagamento');
  const notes = text(data.notes, 'Observações', { required: false, max: 5000 });
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 100)
    fail(400, 'A venda deve ter entre 1 e 100 itens.');
  const lines = data.items.map((line) => ({
    item_id: identifier(line.item_id),
    quantity: integer(line.quantity, 'Quantidade', 1, 1000000)
  }));
  if (new Set(lines.map((line) => line.item_id)).size !== lines.length)
    fail(400, 'Agrupe as quantidades de itens repetidos.');
  lines.sort((a, b) => a.item_id - b.item_id);
  return transaction(async () => {
    await reference(one, 'clients', clientId, 'Cliente');
    const prepared = [];
    let total = 0;
    for (const line of lines) {
      const item = await one(`SELECT * FROM items WHERE id = ? AND archived = 0${lock}`, [line.item_id]);
      if (!item) fail(400, 'Um dos itens não está mais disponível.');
      if (item.type === 'product' && item.stock < line.quantity)
        fail(409, `Estoque insuficiente para ${item.name}. Disponível: ${item.stock}.`);
      total += item.price_cents * line.quantity;
      if (!Number.isSafeInteger(total) || total > 2000000000)
        fail(400, 'Valor da venda excede o limite permitido.');
      prepared.push({ ...line, item });
    }
    const id = await insert('sales', {
      client_id: clientId,
      user_id: userId,
      total_cents: total,
      payment_method: payment,
      status: 'completed',
      notes,
      created_at: new Date().toISOString()
    });
    for (const { item, quantity } of prepared) {
      await insert('sale_items', {
        sale_id: id,
        item_id: item.id,
        name: item.name,
        type: item.type,
        quantity,
        price_cents: item.price_cents,
        cost_cents: item.cost_cents
      });
      if (item.type === 'product') await move(item, -quantity, 'sale', `Venda #${id}`, userId, id);
    }
    return saleDetail(id);
  });
}

export async function saleDetail(id) {
  const sale = await one(
    'SELECT s.*, c.name AS client_name, u.name AS user_name FROM sales s LEFT JOIN clients c ON c.id = s.client_id JOIN users u ON u.id = s.user_id WHERE s.id = ?',
    [id]
  );
  if (!sale) fail(404, 'Venda não encontrada.');
  return {
    ...sale,
    items: (await query('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY id', [id])).rows
  };
}
export async function listSales() {
  return (
    await query(
      'SELECT s.*, c.name AS client_name, u.name AS user_name FROM sales s LEFT JOIN clients c ON c.id = s.client_id JOIN users u ON u.id = s.user_id ORDER BY s.id DESC'
    )
  ).rows;
}

export async function cancelSale(id, reason, userId) {
  reason = text(reason, 'Motivo do cancelamento', { max: 500 });
  return transaction(async () => {
    const sale = await one(`SELECT * FROM sales WHERE id = ?${lock}`, [id]);
    if (!sale) fail(404, 'Venda não encontrada.');
    if (sale.status !== 'completed') fail(409, 'Esta venda já foi cancelada.');
    const lines = (await query('SELECT * FROM sale_items WHERE sale_id = ? ORDER BY item_id', [id])).rows;
    for (const line of lines) {
      if (line.type !== 'product') continue;
      const item = await one(`SELECT * FROM items WHERE id = ?${lock}`, [line.item_id]);
      await move(item, line.quantity, 'return', `Cancelamento #${id}: ${reason}`, userId, id);
      if (item.archived) await query('UPDATE items SET archived = 0 WHERE id = ?', [item.id]);
    }
    await query('UPDATE sales SET status = ?, cancelled_at = ? WHERE id = ?', [
      'cancelled',
      new Date().toISOString(),
      id
    ]);
    return saleDetail(id);
  });
}

export async function report(from, to) {
  const valid = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(new Date(`${value}T00:00:00.000Z`).getTime()) &&
    new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
  if (!valid(from) || !valid(to) || from > to) fail(400, 'Informe um período válido.');
  const start = `${from}T00:00:00.000Z`;
  const end = `${to}T23:59:59.999Z`;
  const sales = (
    await query(
      'SELECT s.*, c.name AS client_name FROM sales s LEFT JOIN clients c ON c.id = s.client_id WHERE s.created_at >= ? AND s.created_at <= ? ORDER BY s.created_at DESC',
      [start, end]
    )
  ).rows;
  const completed = sales.filter((sale) => sale.status === 'completed');
  const lines = (
    await query(
      "SELECT si.*, s.created_at FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE s.status = 'completed' AND s.created_at >= ? AND s.created_at <= ?",
      [start, end]
    )
  ).rows;
  const products = (
    await query("SELECT * FROM items WHERE type = 'product' AND archived = 0 ORDER BY stock, name")
  ).rows;
  const days = new Map();
  const top = new Map();
  for (const sale of completed) {
    const day = sale.created_at.slice(0, 10);
    days.set(day, (days.get(day) || 0) + sale.total_cents);
  }
  for (const line of lines) {
    const current = top.get(line.item_id) || { name: line.name, quantity: 0, revenue_cents: 0 };
    current.quantity += line.quantity;
    current.revenue_cents += line.quantity * line.price_cents;
    top.set(line.item_id, current);
  }
  const revenue = completed.reduce((sum, sale) => sum + sale.total_cents, 0);
  return {
    from,
    to,
    revenue_cents: revenue,
    sales_count: completed.length,
    cancelled_count: sales.length - completed.length,
    average_cents: completed.length ? Math.round(revenue / completed.length) : 0,
    margin_cents: lines.reduce((sum, line) => sum + (line.price_cents - line.cost_cents) * line.quantity, 0),
    clients_count: Number((await one('SELECT COUNT(*) AS total FROM clients WHERE archived = 0')).total),
    stock_value_cents: products.reduce((sum, item) => sum + item.stock * item.cost_cents, 0),
    low_stock: products.filter((item) => item.stock <= item.stock_minimum),
    series: [...days]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, total_cents]) => ({ day, total_cents })),
    top_items: [...top.values()].sort((a, b) => b.revenue_cents - a.revenue_cents).slice(0, 10),
    sales
  };
}

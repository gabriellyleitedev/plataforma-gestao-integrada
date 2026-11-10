import { useState } from 'react';
import { useData } from '../hooks/useData.js';
import { useAuth } from '../hooks/useAuth.js';
import { api, dateTime, shortName } from '../services/api.js';
import { PageHeader, Field, Modal, Message, Empty, Loading, Icon, Badge } from '../components/ui.jsx';

const movementLabels = {
  entry: 'Entrada',
  exit: 'Saída',
  adjustment: 'Ajuste',
  sale: 'Venda',
  return: 'Cancelamento'
};

export function StockPage() {
  const { user } = useAuth();
  const items = useData('/items');
  const movements = useData('/stock/movements');
  const [tab, setTab] = useState('balance');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState('');
  const [type, setType] = useState('entry');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const products = (items.data || []).filter((item) => item.type === 'product');
  const current = products.find((item) => String(item.id) === selected);
  const filtered = products.filter((item) =>
    `${item.name} ${item.sku}`.toLowerCase().includes(search.toLowerCase())
  );
  const history = (movements.data || []).filter((row) =>
    `${row.item_name} ${row.reason}`.toLowerCase().includes(search.toLowerCase())
  );
  const editable = user.role !== 'operator';
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api('/stock/movements', {
        method: 'POST',
        body: { ...values, item_id: Number(values.item_id), quantity: Number(values.quantity) }
      });
      setModal(false);
      setSuccess('Movimentação registrada e saldo atualizado.');
      items.reload();
      movements.reload();
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  function open(id = '') {
    setSelected(String(id));
    setType('entry');
    setError('');
    setModal(true);
    setSuccess('');
  }
  return (
    <>
      <PageHeader
        title="Controle de estoque"
        description="Cada entrada, saída e ajuste com seu histórico preservado."
        action={
          editable && (
            <button className="button primary" onClick={() => open()}>
              <Icon name="plus" />
              Nova movimentação
            </button>
          )
        }
      />
      <Message success>{success}</Message>
      <Message>{items.error || movements.error}</Message>
      <div className="mini-stats">
        <div>
          <span>Produtos cadastrados</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Unidades em estoque</span>
          <strong>{products.reduce((sum, item) => sum + item.stock, 0)}</strong>
        </div>
        <div>
          <span>No limite ou abaixo do mínimo</span>
          <strong>{products.filter((item) => item.stock <= item.stock_minimum).length}</strong>
        </div>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <div className="tabs">
            <button className={tab === 'balance' ? 'active' : ''} onClick={() => setTab('balance')}>
              Saldos atuais
            </button>
            <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
              Histórico
            </button>
          </div>
          <div className="search-input">
            <Icon name="search" />
            <input
              aria-label="Buscar no estoque"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar produto…"
            />
          </div>
        </div>
        {items.loading || movements.loading ? (
          <Loading />
        ) : tab === 'balance' ? (
          !filtered.length ? (
            <Empty detail="Cadastre produtos no catálogo para movimentar o estoque." />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Saldo</th>
                    <th>Mínimo</th>
                    <th>Situação</th>
                    {editable && <th />}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.name}</strong>
                      </td>
                      <td>{item.sku || '—'}</td>
                      <td>{item.stock} un.</td>
                      <td>{item.stock_minimum} un.</td>
                      <td>
                        <Badge tone={item.stock <= item.stock_minimum ? 'amber' : 'green'}>
                          {item.stock <= item.stock_minimum ? 'Repor estoque' : 'Regular'}
                        </Badge>
                      </td>
                      {editable && (
                        <td className="align-right">
                          <button className="text-button" onClick={() => open(item.id)}>
                            Movimentar <Icon name="arrow" size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : !history.length ? (
          <Empty title="Sem movimentações" detail="As entradas, saídas, vendas e ajustes aparecerão aqui." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Variação</th>
                  <th>Saldo após</th>
                  <th>Motivo</th>
                  <th>Responsável</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id}>
                    <td>{dateTime(row.created_at)}</td>
                    <td>
                      <strong>{row.item_name}</strong>
                    </td>
                    <td>
                      <Badge>{movementLabels[row.type]}</Badge>
                    </td>
                    <td className={row.quantity > 0 ? 'positive' : 'negative'}>
                      {row.quantity > 0 ? '+' : ''}
                      {row.quantity}
                    </td>
                    <td>{row.balance_after}</td>
                    <td>{row.reason}</td>
                    <td>{shortName(row.user_name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {modal && (
        <Modal title="Nova movimentação" onClose={() => setModal(false)}>
          <form onSubmit={submit}>
            <Field label="Produto">
              <select
                name="item_id"
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                required
              >
                <option value="">Selecione um produto</option>
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · Saldo {item.stock}
                  </option>
                ))}
              </select>
            </Field>
            {current && (
              <p className="inline-note">
                Saldo atual: <strong>{current.stock} unidades</strong>
              </p>
            )}
            <Field label="Tipo de movimentação">
              <select name="type" value={type} onChange={(event) => setType(event.target.value)}>
                <option value="entry">Entrada</option>
                <option value="exit">Saída</option>
                <option value="adjustment">Ajuste de saldo</option>
              </select>
            </Field>
            <Field
              label={type === 'adjustment' ? 'Novo saldo total' : 'Quantidade'}
              hint={
                type === 'adjustment'
                  ? 'Informe o saldo final contado. A diferença ficará registrada.'
                  : 'O estoque não pode ficar negativo.'
              }
            >
              <input
                name="quantity"
                type="number"
                min={type === 'adjustment' ? 0 : 1}
                max="1000000"
                step="1"
                required
              />
            </Field>
            <Field label="Motivo">
              <textarea name="reason" required maxLength={500} rows={3} />
            </Field>
            <Message>{error}</Message>
            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setModal(false)}>
                Cancelar
              </button>
              <button className="button primary" disabled={busy}>
                {busy ? 'Registrando…' : 'Registrar movimentação'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

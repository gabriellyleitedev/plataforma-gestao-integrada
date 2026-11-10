import { useState } from 'react';
import { useData } from '../hooks/useData.js';
import { useAuth } from '../hooks/useAuth.js';
import { api, money, dateTime, payments, shortName } from '../services/api.js';
import { PageHeader, Field, Modal, Message, Empty, Loading, Icon, Badge } from '../components/ui.jsx';

function SaleForm({ onClose, onSaved }) {
  const catalog = useData('/items');
  const clients = useData('/clients');
  const [cart, setCart] = useState([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const items = catalog.data || [];
  function add() {
    const item = items.find((row) => String(row.id) === selected);
    if (!item) return;
    setCart((old) =>
      old.some((row) => row.item.id === item.id)
        ? old.map((row) => (row.item.id === item.id ? { ...row, quantity: row.quantity + 1 } : row))
        : [...old, { item, quantity: 1 }]
    );
    setSelected('');
    setError('');
  }
  const total = cart.reduce((sum, row) => sum + row.item.price_cents * row.quantity, 0);
  async function submit(event) {
    event.preventDefault();
    if (!cart.length) return setError('Adicione ao menos um produto ou serviço.');
    setBusy(true);
    setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const sale = await api('/sales', {
        method: 'POST',
        body: {
          client_id: values.client_id ? Number(values.client_id) : null,
          payment_method: values.payment_method,
          notes: values.notes,
          items: cart.map((row) => ({ item_id: row.item.id, quantity: row.quantity }))
        }
      });
      onSaved(sale);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Registrar venda" onClose={onClose}>
      {catalog.loading || clients.loading ? (
        <Loading />
      ) : (
        <form onSubmit={submit}>
          <Message>{catalog.error || clients.error}</Message>
          <div className="form-grid">
            <Field label="Cliente">
              <select name="client_id">
                <option value="">Consumidor não identificado</option>
                {clients.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pagamento">
              <select name="payment_method">
                {Object.entries(payments).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="cart-add">
            <Field label="Produto ou serviço">
              <select
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                aria-label="Produto ou serviço da venda"
              >
                <option value="">Selecione um item do catálogo</option>
                {items.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    disabled={item.type === 'product' && item.stock === 0}
                  >
                    {item.name} · {money(item.price_cents)}
                    {item.type === 'product' ? ` · ${item.stock} un.` : ' · Serviço'}
                  </option>
                ))}
              </select>
            </Field>
            <button type="button" className="button secondary" onClick={add} disabled={!selected}>
              Adicionar
            </button>
          </div>
          {!cart.length ? (
            <p className="inline-note">Os itens adicionados aparecerão aqui.</p>
          ) : (
            <div className="cart-lines">
              {cart.map(({ item, quantity }) => (
                <div className="cart-line" key={item.id}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {money(item.price_cents)} / unidade {item.type === 'service' && '· Serviço'}
                    </small>
                  </div>
                  <label className="quantity-field">
                    <span className="sr-only">Quantidade de {item.name}</span>
                    <input
                      type="number"
                      min="1"
                      max={item.type === 'product' ? item.stock : 1000000}
                      step="1"
                      required
                      value={quantity}
                      onChange={(event) =>
                        setCart((old) =>
                          old.map((line) =>
                            line.item.id === item.id
                              ? { ...line, quantity: Number(event.target.value) }
                              : line
                          )
                        )
                      }
                    />
                  </label>
                  <strong>{money(item.price_cents * quantity)}</strong>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Remover ${item.name}`}
                    onClick={() => setCart((old) => old.filter((line) => line.item.id !== item.id))}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="sale-total">
            <span>Total da venda</span>
            <strong>{money(total)}</strong>
          </div>
          <Field label="Observações">
            <textarea name="notes" rows={2} maxLength={5000} />
          </Field>
          <p className="muted">
            Os preços são conferidos na API. Apenas produtos terão baixa automática de estoque.
          </p>
          <Message>{error}</Message>
          <div className="form-actions">
            <button type="button" className="button secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="button primary" disabled={busy || !cart.length}>
              {busy ? 'Registrando…' : 'Confirmar venda'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function SalesPage() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useData('/sales');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [failure, setFailure] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const rows = (data || []).filter(
    (sale) =>
      `${sale.id} ${sale.client_name || 'Consumidor não identificado'}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!filter || sale.status === filter)
  );
  async function openDetail(id) {
    setFailure('');
    try {
      setDetail(await api(`/sales/${id}`));
    } catch (error) {
      setFailure(error.message);
    }
  }
  async function cancel(event) {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api(`/sales/${cancelling.id}/cancel`, { method: 'POST', body: values });
      setCancelling(null);
      setDetail(null);
      setSuccess('Venda cancelada. Os produtos retornaram ao estoque.');
      reload();
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        title="Vendas"
        description="Do primeiro item ao fechamento, acompanhe cada venda."
        action={
          <button
            className="button primary"
            onClick={() => {
              setCreating(true);
              setFailure('');
              setSuccess('');
            }}
          >
            <Icon name="plus" />
            Nova venda
          </button>
        }
      />
      <Message success>{success}</Message>
      <Message>{error || (!cancelling && failure)}</Message>
      <section className="panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Icon name="search" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar vendas"
              placeholder="Buscar por número ou cliente…"
            />
          </div>
          <select
            aria-label="Filtrar vendas"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">Todas as vendas</option>
            <option value="completed">Concluídas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
        {loading ? (
          <Loading />
        ) : !rows.length ? (
          <Empty
            title="Suas vendas começam aqui"
            detail="Cadastre produtos ou serviços e registre sua primeira venda."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Venda</th>
                  <th>Cliente</th>
                  <th>Data</th>
                  <th>Pagamento</th>
                  <th>Total</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((sale) => (
                  <tr key={sale.id}>
                    <td>
                      <strong>#{String(sale.id).padStart(4, '0')}</strong>
                    </td>
                    <td>{sale.client_name || 'Consumidor não identificado'}</td>
                    <td>{dateTime(sale.created_at)}</td>
                    <td>{payments[sale.payment_method]}</td>
                    <td>
                      <strong>{money(sale.total_cents)}</strong>
                    </td>
                    <td>
                      <Badge tone={sale.status === 'completed' ? 'green' : 'red'}>
                        {sale.status === 'completed' ? 'Concluída' : 'Cancelada'}
                      </Badge>
                    </td>
                    <td className="align-right">
                      <button className="text-button" onClick={() => openDetail(sale.id)}>
                        Ver detalhes <Icon name="arrow" size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {creating && (
        <SaleForm
          onClose={() => setCreating(false)}
          onSaved={(sale) => {
            setCreating(false);
            setDetail(sale);
            setSuccess(`Venda #${sale.id} registrada com sucesso.`);
            reload();
          }}
        />
      )}{' '}
      {detail && !cancelling && (
        <Modal title={`Venda #${String(detail.id).padStart(4, '0')}`} onClose={() => setDetail(null)}>
          <div className="detail-grid">
            <div>
              <small>Cliente</small>
              <strong>{detail.client_name || 'Consumidor não identificado'}</strong>
            </div>
            <div>
              <small>Data</small>
              <strong>{dateTime(detail.created_at)}</strong>
            </div>
            <div>
              <small>Responsável</small>
              <strong>{shortName(detail.user_name)}</strong>
            </div>
            <div>
              <small>Pagamento</small>
              <strong>{payments[detail.payment_method]}</strong>
            </div>
          </div>
          <Badge tone={detail.status === 'completed' ? 'green' : 'red'}>
            {detail.status === 'completed' ? 'Concluída' : 'Cancelada'}
          </Badge>
          <div className="cart-lines">
            {detail.items.map((line) => (
              <div className="cart-line" key={line.id}>
                <div>
                  <strong>{line.name}</strong>
                  <small>
                    {line.quantity} × {money(line.price_cents)} ·{' '}
                    {line.type === 'service' ? 'Serviço' : 'Produto'}
                  </small>
                </div>
                <strong>{money(line.quantity * line.price_cents)}</strong>
              </div>
            ))}
          </div>
          <div className="sale-total">
            <span>Total</span>
            <strong>{money(detail.total_cents)}</strong>
          </div>
          {detail.notes && <p className="notes-cell">{detail.notes}</p>}
          {detail.cancelled_at && <p className="muted">Cancelada em {dateTime(detail.cancelled_at)}</p>}
          <div className="form-actions">
            {user.role !== 'operator' && detail.status === 'completed' && (
              <button
                className="button danger-button"
                onClick={() => {
                  setCancelling(detail);
                  setFailure('');
                }}
              >
                Cancelar venda
              </button>
            )}
            <button className="button secondary" onClick={() => setDetail(null)}>
              Fechar
            </button>
          </div>
        </Modal>
      )}
      {cancelling && (
        <Modal title={`Cancelar venda #${cancelling.id}`} onClose={() => setCancelling(null)}>
          <form onSubmit={cancel}>
            <p>
              O cancelamento devolverá os produtos ao estoque e excluirá a venda dos indicadores de
              faturamento. O histórico será preservado.
            </p>
            <Field label="Motivo do cancelamento">
              <textarea name="reason" required maxLength={500} rows={3} />
            </Field>
            <Message>{failure}</Message>
            <div className="form-actions">
              <button type="button" className="button secondary" onClick={() => setCancelling(null)}>
                Voltar
              </button>
              <button className="button danger-button" disabled={busy}>
                {busy ? 'Cancelando…' : 'Confirmar cancelamento'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

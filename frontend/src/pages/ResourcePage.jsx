import { useState } from 'react';
import { useData } from '../hooks/useData.js';
import { useAuth } from '../hooks/useAuth.js';
import { api, money, dateTime, roles } from '../services/api.js';
import { PageHeader, Modal, Field, Message, Empty, Loading, Icon, Badge } from '../components/ui.jsx';

const definitions = {
  clients: {
    title: 'Clientes',
    description: 'Conheça e organize quem faz parte do seu negócio.',
    singular: 'cliente',
    fields: ['name', 'email', 'phone', 'document', 'notes']
  },
  suppliers: {
    title: 'Fornecedores',
    description: 'Mantenha seus parceiros e contatos sempre por perto.',
    singular: 'fornecedor',
    fields: ['name', 'email', 'phone', 'document', 'notes']
  },
  categories: {
    title: 'Categorias',
    description: 'Organize seu catálogo para encontrar tudo com facilidade.',
    singular: 'categoria',
    fields: ['name', 'description']
  },
  items: {
    title: 'Produtos e serviços',
    description: 'Tudo o que seu negócio oferece, em um único catálogo.',
    singular: 'item',
    fields: [
      'name',
      'type',
      'sku',
      'price_cents',
      'cost_cents',
      'category_id',
      'supplier_id',
      'stock_minimum',
      'description'
    ]
  },
  appointments: {
    title: 'Atendimentos',
    description: 'Acompanhe conversas, solicitações e próximos compromissos.',
    singular: 'atendimento',
    fields: ['client_id', 'subject', 'scheduled_at', 'status', 'notes']
  },
  users: {
    title: 'Usuários',
    description: 'Gerencie quem acessa o sistema e as permissões de cada pessoa.',
    singular: 'usuário',
    fields: ['name', 'email', 'role', 'password', 'active']
  }
};
const labels = {
  name: 'Nome',
  email: 'E-mail',
  phone: 'Telefone',
  document: 'CPF / CNPJ',
  notes: 'Observações',
  description: 'Descrição',
  type: 'Tipo',
  sku: 'Código / SKU',
  price_cents: 'Preço de venda (R$)',
  cost_cents: 'Custo (R$)',
  category_id: 'Categoria',
  supplier_id: 'Fornecedor',
  stock_minimum: 'Estoque mínimo',
  client_id: 'Cliente',
  subject: 'Assunto',
  scheduled_at: 'Data e hora',
  status: 'Situação',
  role: 'Perfil de acesso',
  password: 'Senha',
  active: 'Acesso ativo'
};
const statuses = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado'
};

function localDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function ResourceForm({ resource, record, onClose, onSaved }) {
  const definition = definitions[resource];
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState(record?.type || 'product');
  const [options, setOptions] = useState(null);
  const [optionsError, setOptionsError] = useState('');
  const optionPath =
    resource === 'items' ? '/categories' : resource === 'appointments' ? '/clients' : '/setup';
  const lookup = useData(optionPath);
  const suppliers = useData(resource === 'items' ? '/suppliers' : '/setup');
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (resource === 'items') {
      for (const key of ['price_cents', 'cost_cents'])
        values[key] = Math.round(Number(values[key] || 0) * 100);
      values.stock_minimum = Number(values.stock_minimum || 0);
      values.category_id = values.category_id ? Number(values.category_id) : null;
      values.supplier_id = values.supplier_id ? Number(values.supplier_id) : null;
    }
    if (resource === 'appointments') {
      values.client_id = Number(values.client_id);
      values.scheduled_at = new Date(values.scheduled_at).toISOString();
    }
    if (resource === 'users') values.active = values.active === 'on';
    setBusy(true);
    setError('');
    try {
      await api(`/${resource}${record ? `/${record.id}` : ''}`, {
        method: record ? 'PUT' : 'POST',
        body: values
      });
      onSaved();
    } catch (error) {
      setError(error.message || 'Não foi possível salvar. Confira sua conexão.');
    } finally {
      setBusy(false);
    }
  }
  async function refreshOptions() {
    setOptionsError('');
    try {
      setOptions(await api(optionPath));
    } catch (error) {
      setOptionsError(error.message);
    }
  }
  function input(key) {
    const value = record?.[key] ?? '';
    if (key === 'type')
      return (
        <select name={key} value={type} onChange={(event) => setType(event.target.value)}>
          <option value="product">Produto</option>
          <option value="service">Serviço</option>
        </select>
      );
    if (key === 'role')
      return (
        <select name={key} defaultValue={value || 'operator'}>
          {Object.entries(roles).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      );
    if (key === 'active')
      return <input type="checkbox" name={key} defaultChecked={record ? Boolean(record.active) : true} />;
    if (key === 'status')
      return (
        <select name={key} defaultValue={value || 'open'}>
          {Object.entries(statuses).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      );
    if (['category_id', 'supplier_id', 'client_id'].includes(key)) {
      const source = key === 'supplier_id' ? suppliers : lookup;
      const choices = key === 'supplier_id' ? source.data : options || source.data;
      return (
        <select
          name={key}
          defaultValue={value}
          required={key === 'client_id'}
          disabled={source.loading || (key === 'supplier_id' && type === 'service')}
        >
          <option value="">
            {source.loading ? 'Carregando…' : key === 'client_id' ? 'Selecione um cliente' : 'Sem vínculo'}
          </option>
          {Array.isArray(choices) &&
            choices.map((row) => (
              <option value={row.id} key={row.id}>
                {row.name}
              </option>
            ))}
        </select>
      );
    }
    if (['description', 'notes'].includes(key))
      return <textarea name={key} defaultValue={value} rows={3} maxLength={5000} />;
    if (key === 'scheduled_at')
      return <input name={key} type="datetime-local" defaultValue={localDateTime(value)} required />;
    if (['price_cents', 'cost_cents'].includes(key))
      return (
        <input
          name={key}
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          required={key === 'price_cents'}
          defaultValue={value === '' ? '' : (value / 100).toFixed(2)}
        />
      );
    if (key === 'stock_minimum')
      return (
        <input
          name={key}
          type="number"
          min="0"
          max="1000000"
          step="1"
          defaultValue={value || 0}
          disabled={type === 'service'}
        />
      );
    if (key === 'password')
      return (
        <input
          name={key}
          type="password"
          required={!record}
          minLength={10}
          maxLength={128}
          autoComplete="new-password"
          placeholder={record ? 'Deixe vazio para manter a atual' : 'Mínimo de 10 caracteres'}
        />
      );
    return (
      <input
        name={key}
        type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
        defaultValue={value}
        required={['name', 'subject'].includes(key) || (resource === 'users' && key === 'email')}
        maxLength={
          key === 'email' ? 190 : ['phone', 'document'].includes(key) ? 40 : key === 'sku' ? 80 : 160
        }
      />
    );
  }
  return (
    <Modal
      title={`${record ? 'Editar' : resource === 'categories' ? 'Nova' : 'Novo'} ${definition.singular}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          {definition.fields.map((key) => (
            <Field
              key={key}
              label={labels[key]}
              hint={key === 'type' && type === 'service' ? 'Serviços não movimentam estoque.' : undefined}
            >
              {input(key)}
            </Field>
          ))}
        </div>
        <Message>{error || lookup.error || suppliers.error || optionsError}</Message>
        {['items', 'appointments'].includes(resource) && (
          <button type="button" className="text-button" onClick={refreshOptions}>
            Atualizar opções de cadastro
          </button>
        )}
        <div className="form-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" disabled={busy || lookup.loading || suppliers.loading}>
            {busy ? 'Salvando…' : 'Salvar cadastro'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ResourcePage({ resource }) {
  const { user } = useAuth();
  const { data, loading, error, reload } = useData(`/${resource}`);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [editing, setEditing] = useState(undefined);
  const [archive, setArchive] = useState(null);
  const [failure, setFailure] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const definition = definitions[resource];
  const canEdit = user.role !== 'operator' || ['clients', 'appointments'].includes(resource);
  if (resource === 'users' && user.role !== 'admin')
    return <Message>Apenas administradores podem gerenciar usuários.</Message>;
  const rows = (data || []).filter(
    (row) =>
      [row.name, row.email, row.phone, row.sku, row.subject, row.client_name, row.document]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!filter || row.type === filter || row.status === filter)
  );
  async function confirmArchive() {
    setBusy(true);
    setFailure('');
    try {
      await api(`/${resource}/${archive.id}`, { method: 'DELETE' });
      setArchive(null);
      setSuccess('Registro arquivado. Histórico preservado.');
      reload();
    } catch (error) {
      setFailure(error.message);
    } finally {
      setBusy(false);
    }
  }
  const addButton = canEdit && (
    <button
      className="button primary"
      onClick={() => {
        setEditing(null);
        setSuccess('');
      }}
    >
      <Icon name="plus" />
      {resource === 'categories' ? 'Nova' : 'Novo'} {definition.singular}
    </button>
  );
  return (
    <>
      <PageHeader title={definition.title} description={definition.description} action={addButton} />
      <Message success>{success}</Message>
      <Message>{error}</Message>
      <section className="panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Icon name="search" />
            <input
              aria-label={`Buscar ${definition.title.toLowerCase()}`}
              placeholder="Buscar por nome, código ou contato…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="toolbar-options">
            {resource === 'items' && (
              <select
                aria-label="Filtrar tipo"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="">Todos os tipos</option>
                <option value="product">Produtos</option>
                <option value="service">Serviços</option>
              </select>
            )}
            {resource === 'appointments' && (
              <select
                aria-label="Filtrar situação"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="">Todas as situações</option>
                {Object.entries(statuses).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            <span className="muted">{rows.length} registro(s)</span>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : !rows.length ? (
          <Empty
            detail={
              search || filter
                ? 'Nenhum resultado para os filtros selecionados.'
                : 'Cadastre seu primeiro registro. Seus dados aparecerão aqui.'
            }
            action={!search && addButton}
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{resource === 'appointments' ? 'Atendimento' : 'Nome'}</th>
                  {resource === 'items' ? (
                    <>
                      <th>Tipo</th>
                      <th>Categoria</th>
                      <th>Preço</th>
                      <th>Estoque</th>
                    </>
                  ) : resource === 'appointments' ? (
                    <>
                      <th>Cliente</th>
                      <th>Agendamento</th>
                      <th>Situação</th>
                    </>
                  ) : resource === 'categories' ? (
                    <th>Descrição</th>
                  ) : resource === 'users' ? (
                    <>
                      <th>E-mail</th>
                      <th>Perfil</th>
                      <th>Situação</th>
                    </>
                  ) : (
                    <>
                      <th>Contato</th>
                      <th>Documento</th>
                    </>
                  )}
                  {canEdit && <th className="align-right">Ações</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name || row.subject}</strong>
                      {resource === 'items' && (
                        <small className="cell-subtitle">{row.sku || `#${row.id}`}</small>
                      )}
                    </td>
                    {resource === 'items' ? (
                      <>
                        <td>
                          <Badge tone={row.type === 'service' ? 'violet' : ''}>
                            {row.type === 'service' ? 'Serviço' : 'Produto'}
                          </Badge>
                        </td>
                        <td>{row.category_name || '—'}</td>
                        <td>{money(row.price_cents)}</td>
                        <td>
                          {row.type === 'service' ? (
                            'Não se aplica'
                          ) : (
                            <Badge tone={row.stock <= row.stock_minimum ? 'amber' : 'green'}>
                              {row.stock} un.
                            </Badge>
                          )}
                        </td>
                      </>
                    ) : resource === 'appointments' ? (
                      <>
                        <td>{row.client_name}</td>
                        <td>{dateTime(row.scheduled_at)}</td>
                        <td>
                          <Badge
                            tone={
                              row.status === 'completed' ? 'green' : row.status === 'cancelled' ? 'red' : ''
                            }
                          >
                            {statuses[row.status]}
                          </Badge>
                        </td>
                      </>
                    ) : resource === 'categories' ? (
                      <td className="notes-cell">{row.description || '—'}</td>
                    ) : resource === 'users' ? (
                      <>
                        <td>{row.email}</td>
                        <td>{roles[row.role]}</td>
                        <td>
                          <Badge tone={row.active ? 'green' : 'red'}>
                            {row.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {row.email || '—'}
                          <small className="cell-subtitle">{row.phone}</small>
                        </td>
                        <td>{row.document || '—'}</td>
                      </>
                    )}
                    {canEdit && (
                      <td className="align-right">
                        <div className="row-actions">
                          <button
                            className="text-button"
                            onClick={() => {
                              setEditing(row);
                              setSuccess('');
                            }}
                            aria-label={`Editar ${row.name || row.subject}`}
                          >
                            <Icon name="edit" size={15} />
                            Editar
                          </button>
                          {resource !== 'users' && (
                            <button
                              className="text-button danger"
                              onClick={() => {
                                setArchive(row);
                                setFailure('');
                              }}
                            >
                              Arquivar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing !== undefined && (
        <ResourceForm
          resource={resource}
          record={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            setSuccess('Cadastro salvo com sucesso.');
            reload();
          }}
        />
      )}{' '}
      {archive && (
        <Modal title="Arquivar registro" onClose={() => setArchive(null)}>
          <p>
            Arquivar <strong>{archive.name || archive.subject}</strong>? O registro sairá das listas de novos
            cadastros, mas seu histórico será preservado.
          </p>
          <Message>{failure}</Message>
          <div className="form-actions">
            <button className="button secondary" onClick={() => setArchive(null)}>
              Voltar
            </button>
            <button className="button danger-button" disabled={busy} onClick={confirmArchive}>
              {busy ? 'Arquivando…' : 'Confirmar arquivamento'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

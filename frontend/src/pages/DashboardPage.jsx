import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData.js';
import { useAuth } from '../hooks/useAuth.js';
import { money, dateTime, payments } from '../services/api.js';
import { PageHeader, Icon, Message, Loading, Empty, Badge, Field } from '../components/ui.jsx';

function monthPeriod() {
  const today = new Date().toISOString().slice(0, 10);
  return { from: `${today.slice(0, 7)}-01`, to: today };
}
function RevenueChart({ series }) {
  if (!series.length)
    return (
      <Empty
        title="Ainda não há vendas neste período"
        detail="Ao registrar uma venda, seu faturamento aparecerá aqui."
      />
    );
  const max = Math.max(...series.map((row) => row.total_cents), 1);
  const width = 620,
    height = 190;
  const points = series.map(
    (row, index) =>
      `${30 + (index * (width - 60)) / Math.max(series.length - 1, 1)},${height - 22 - (row.total_cents / max) * (height - 55)}`
  );
  return (
    <div className="revenue-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Faturamento diário no período">
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity=".22" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[35, 80, 125, 168].map((y) => (
          <line key={y} x1="20" y1={y} x2="600" y2={y} stroke="#e9edef" strokeDasharray="4 5" />
        ))}
        <polygon
          points={`${points[0].split(',')[0]},168 ${points.join(' ')} ${points.at(-1).split(',')[0]},168`}
          fill="url(#revenue-fill)"
        />
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke="#0d9488"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {series.map((row, index) => (
          <circle
            key={row.day}
            cx={points[index].split(',')[0]}
            cy={points[index].split(',')[1]}
            r="4"
            fill="#0d9488"
          >
            <title>
              {row.day}: {money(row.total_cents)}
            </title>
          </circle>
        ))}
      </svg>
      <div className="chart-dates">
        <span>{series[0].day.split('-').reverse().join('/')}</span>
        <span>{series.at(-1).day.split('-').reverse().join('/')}</span>
      </div>
      <details className="chart-data">
        <summary>Ver valores por dia</summary>
        <table>
          <thead>
            <tr>
              <th>Data (UTC)</th>
              <th>Faturamento</th>
            </tr>
          </thead>
          <tbody>
            {series.map((row) => (
              <tr key={row.day}>
                <td>{row.day.split('-').reverse().join('/')}</td>
                <td>{money(row.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

function downloadCsv(data) {
  const escape = (value) => {
    const text = String(value ?? '');
    return `"${(/^[=+@\-\t\r]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
  };
  const rows = [
    ['Venda', 'Data UTC', 'Cliente', 'Pagamento', 'Situação', 'Total (BRL)'],
    ...data.sales.map((sale) => [
      sale.id,
      sale.created_at,
      sale.client_name || 'Consumidor não identificado',
      payments[sale.payment_method],
      sale.status === 'completed' ? 'Concluída' : 'Cancelada',
      (sale.total_cents / 100).toFixed(2).replace('.', ',')
    ])
  ];
  const url = URL.createObjectURL(
    new Blob(['\uFEFF', rows.map((row) => row.map(escape).join(';')).join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `vendas-${data.from}-${data.to}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DashboardPage({ reports = false }) {
  const { user } = useAuth();
  const [period, setPeriod] = useState(monthPeriod);
  const [error, setError] = useState('');
  const response = useData(`/reports?from=${period.from}&to=${period.to}`);
  const data = response.data;
  function filter(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    if (values.from > values.to) return setError('A data inicial deve ser anterior ou igual à final.');
    setError('');
    setPeriod(values);
  }
  return (
    <>
      <PageHeader
        eyebrow={reports ? 'Análise e acompanhamento' : 'Seu negócio em um olhar'}
        title={reports ? 'Relatórios' : `Olá, ${user.name.split(' ')[0]} 👋`}
        description={
          reports
            ? 'Consulte os resultados do período e exporte o registro de vendas.'
            : 'Acompanhe seus resultados e encontre o próximo passo.'
        }
        action={
          reports ? (
            <button
              className="button secondary"
              disabled={!data || response.loading}
              onClick={() => downloadCsv(data)}
            >
              <Icon name="chart" />
              Exportar CSV
            </button>
          ) : (
            <Link className="button primary" to="/vendas">
              <Icon name="plus" />
              Registrar venda
            </Link>
          )
        }
      />
      <form className="period-filter" onSubmit={filter}>
        <Field label="De">
          <input type="date" name="from" required defaultValue={period.from} />
        </Field>
        <Field label="Até">
          <input type="date" name="to" required defaultValue={period.to} />
        </Field>
        <button className="button secondary">Aplicar período</button>
        <small>Datas de vendas e agrupamento em UTC.</small>
      </form>
      <Message>{error || response.error}</Message>
      {response.loading ? (
        <Loading />
      ) : (
        data && (
          <>
            <div className="stats-grid">
              {[
                [
                  'Faturamento',
                  money(data.revenue_cents),
                  `${data.sales_count} venda(s) concluída(s) no período`,
                  'chart',
                  'teal'
                ],
                [
                  'Vendas realizadas',
                  data.sales_count,
                  `${data.cancelled_count} cancelada(s) no período`,
                  'cart',
                  'blue'
                ],
                ['Ticket médio', money(data.average_cents), 'Média por venda concluída', 'tag', 'purple'],
                ['Clientes cadastrados', data.clients_count, 'Total de clientes ativos', 'users', 'orange']
              ].map(([label, value, hint, icon, color]) => (
                <section className="stat-card" key={label}>
                  <div className="stat-top">
                    <span>{label}</span>
                    <span className={`stat-icon ${color}`}>
                      <Icon name={icon} />
                    </span>
                  </div>
                  <strong className="stat-value">{value}</strong>
                  <small>{hint}</small>
                </section>
              ))}
            </div>
            <div className="dashboard-columns">
              <section className="panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Evolução das vendas</h2>
                    <p>Faturamento diário de vendas concluídas</p>
                  </div>
                  <Badge>Período selecionado</Badge>
                </div>
                <RevenueChart series={data.series} />
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Atenção ao estoque</h2>
                    <p>{data.low_stock.length} produto(s) no limite ou abaixo</p>
                  </div>
                  <span className="stat-icon orange">
                    <Icon name="box" />
                  </span>
                </div>
                {!data.low_stock.length ? (
                  <Empty title="Estoque em dia" detail="Nenhum produto no limite mínimo." />
                ) : (
                  <ul className="stock-alerts">
                    {data.low_stock.slice(0, 5).map((item) => (
                      <li key={item.id}>
                        <span className="item-avatar">
                          <Icon name="box" />
                        </span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>Mínimo: {item.stock_minimum} un.</small>
                        </div>
                        <Badge tone="amber">{item.stock} un.</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <Link className="panel-link" to="/estoque">
                  Ver estoque completo <Icon name="arrow" size={16} />
                </Link>
              </section>
            </div>
            {reports && (
              <div className="mini-stats">
                <div>
                  <span>Margem bruta estimada no período</span>
                  <strong>{money(data.margin_cents)}</strong>
                  <small>Preço menos custo cadastrado; não inclui despesas.</small>
                </div>
                <div>
                  <span>Valor atual do estoque a custo</span>
                  <strong>{money(data.stock_value_cents)}</strong>
                  <small>Saldo atual de produtos ativos, independente do período.</small>
                </div>
              </div>
            )}
            <div className="dashboard-columns">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>{reports ? 'Vendas do período' : 'Últimas vendas'}</h2>
                    <p>Histórico de movimentação do seu negócio</p>
                  </div>
                  <Link className="text-button" to="/vendas">
                    Ver todas <Icon name="arrow" size={15} />
                  </Link>
                </div>
                {!data.sales.length ? (
                  <Empty title="Nenhuma venda registrada" detail="As vendas do período aparecerão aqui." />
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Venda / cliente</th>
                          <th>Data</th>
                          <th>Valor</th>
                          <th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.sales.slice(0, reports ? data.sales.length : 5).map((sale) => (
                          <tr key={sale.id}>
                            <td>
                              <strong>#{String(sale.id).padStart(4, '0')}</strong>
                              <small className="cell-subtitle">
                                {sale.client_name || 'Consumidor não identificado'}
                              </small>
                            </td>
                            <td>{dateTime(sale.created_at)}</td>
                            <td>{money(sale.total_cents)}</td>
                            <td>
                              <Badge tone={sale.status === 'completed' ? 'green' : 'red'}>
                                {sale.status === 'completed' ? 'Concluída' : 'Cancelada'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Destaques do catálogo</h2>
                    <p>Itens com maior faturamento no período</p>
                  </div>
                </div>
                {!data.top_items.length ? (
                  <Empty
                    title="Vamos descobrir seus destaques?"
                    detail="Os itens mais vendidos aparecerão após suas primeiras vendas."
                  />
                ) : (
                  <ol className="top-items">
                    {data.top_items.slice(0, 5).map((item, index) => (
                      <li key={index}>
                        <span className="rank">{String(index + 1).padStart(2, '0')}</span>
                        <div>
                          <strong>{item.name}</strong>
                          <small>{item.quantity} unidade(s) vendida(s)</small>
                        </div>
                        <strong>{money(item.revenue_cents)}</strong>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )
      )}
    </>
  );
}

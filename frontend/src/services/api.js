const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export async function api(path, options = {}) {
  const isStatusQuery = path === '/status' && (options.method || 'GET').toUpperCase() === 'GET';
  const token = sessionStorage.getItem('pgi-token');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal || AbortSignal.timeout(20000)
  });
  const data = await response.json().catch(() => null);
  if (isStatusQuery && response.status === 404) {
    throw new Error(
      'Não conseguimos conectar ao serviço. Precisamos configurar a URL da API para acessar o sistema.'
    );
  }
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event('pgi-session-expired'));
    throw new Error(
      data?.error?.message || `Não foi possível concluir a operação (HTTP ${response.status}).`
    );
  }
  if (!data || typeof data !== 'object' || (isStatusQuery && !['mysql', 'sqlite'].includes(data.storage))) {
    throw new Error('Não conseguimos confirmar a conexão. Precisamos verificar a URL da API.');
  }
  return data;
}

export const money = (cents) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);
export const dateTime = (value) =>
  value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const shortName = (name = '') => {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts.at(-1)}` : parts[0];
};
export const initials = (name) =>
  shortName(name)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();
export const roles = { admin: 'Administrador', manager: 'Gestor', operator: 'Operador' };
export const payments = { pix: 'Pix', cash: 'Dinheiro', credit: 'Crédito', debit: 'Débito', other: 'Outro' };

export async function getHealth({ signal } = {}) {
  const response = await fetch(`${baseUrl}/health`, { signal });
  if (!response.ok) throw new Error(`A API retornou HTTP ${response.status}.`);
  const data = await response.json();
  if (data.status !== 'ok') throw new Error('Resposta de saúde inválida.');
  return data;
}

const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export async function api(path, options = {}) {
  const token = sessionStorage.getItem('pgi-token');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal || AbortSignal.timeout(20000)
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) window.dispatchEvent(new Event('pgi-session-expired'));
    throw new Error(data?.error?.message || `Não foi possível concluir a operação (HTTP ${response.status}).`);
  }
  return data;
}

export const money = (cents) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100);
export const dateTime = (value) => value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const roles = { admin: 'Administrador', manager: 'Gestor', operator: 'Operador' };
export const payments = { pix: 'Pix', cash: 'Dinheiro', credit: 'Crédito', debit: 'Débito', other: 'Outro' };

export async function getHealth({ signal } = {}) {
  const response = await fetch(`${baseUrl}/health`, { signal });
  if (!response.ok) throw new Error(`A API retornou HTTP ${response.status}.`);
  const data = await response.json();
  if (data.status !== 'ok') throw new Error('Resposta de saúde inválida.');
  return data;
}

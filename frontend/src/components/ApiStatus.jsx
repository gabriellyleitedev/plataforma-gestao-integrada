import { useHealth } from '../hooks/useHealth.js';

export function ApiStatus() {
  const { status } = useHealth();
  const labels = {
    loading: 'Verificando conexão com a API…',
    success: 'API conectada — /api/health respondeu corretamente.',
    error: 'API indisponível. Verifique se o backend está em execução.'
  };
  return <p role="status" className={`mt-6 rounded-xl border p-4 text-sm ${status === 'success' ? 'border-emerald-700 text-emerald-300' : 'border-slate-600 text-slate-200'}`}>{labels[status]}</p>;
}

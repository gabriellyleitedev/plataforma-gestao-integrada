import { Link } from 'react-router-dom';
export function NotFoundPage() {
  return <main className="mx-auto max-w-3xl px-6 py-20"><h1 className="text-3xl font-bold">Página não encontrada</h1><Link className="mt-6 inline-block text-emerald-300 underline" to="/">Voltar ao início</Link></main>;
}

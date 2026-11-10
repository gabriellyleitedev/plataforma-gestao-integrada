import { ApiStatus } from '../components/ApiStatus.jsx';

const modules = [
  'Clientes e atendimentos',
  'Produtos e serviços',
  'Categorias e fornecedores',
  'Controle de estoque',
  'Registro de vendas',
  'Indicadores e relatórios',
  'Login e controle de acesso'
];

export function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
        Projeto acadêmico · Base inicial
      </p>
      <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
        Plataforma Web de Gestão Integrada
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-300">
        Uma base para organizar a gestão de micro e pequenas empresas. Os módulos abaixo fazem parte do escopo
        e ainda serão desenvolvidos pela equipe.
      </p>
      <ApiStatus />
      <h2 className="mt-12 text-xl font-semibold">Módulos previstos</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {modules.map((name) => (
          <li key={name} className="rounded-xl border border-slate-700 bg-slate-900 p-5">
            <h3 className="font-medium">{name}</h3>
            <p className="mt-2 text-sm text-slate-400">Desenvolvimento pendente</p>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-slate-400">
        A conexão com a API não verifica a disponibilidade do MySQL.
      </p>
    </main>
  );
}

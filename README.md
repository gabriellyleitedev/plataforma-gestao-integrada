# Integra · Plataforma de Gestão Integrada

TCC do curso Técnico em Desenvolvimento de Sistemas da Etec Itaquera II (2026, 2º semestre).

O Integra junta num só lugar o que um pequeno negócio precisa no dia a dia: clientes, catálogo de produtos e serviços, atendimentos, estoque, vendas e relatórios.

**Acesse:** https://plataforma-gestao-integrada.vercel.app

## Como testar

1. Clique em **Criar conta** e preencha seu nome, o nome do negócio, e-mail e senha (mínimo de 10 caracteres).
2. Pronto, você já entra no painel. Nas próximas vezes, é só usar o mesmo e-mail e senha.
3. Para ver os números no painel: cadastre um produto, dê entrada no estoque e registre uma venda.

Cada conta tem o próprio negócio, e ninguém vê os dados de outro. Se o primeiro acesso demorar, espere até um minuto: a API fica no plano gratuito do Render e "dorme" quando ninguém usa.

## Funcionalidades

- Cadastro de clientes, categorias, fornecedores, produtos, serviços e atendimentos
- Entradas, saídas e ajustes de estoque com histórico
- Vendas com vários itens, baixa automática do estoque e cancelamento
- Painel com faturamento, ticket médio, gráfico de vendas e alerta de estoque baixo
- Relatórios por período com exportação em CSV
- Usuários com perfis de administrador, gestor e operador

## Tecnologias

React + Vite no frontend, Node.js + Express na API e MySQL no banco (SQLite no desenvolvimento). Testes com Node Test Runner e Playwright, rodando no GitHub Actions.

Hospedagem: Vercel (site), Render (API) e TiDB Cloud (banco), todos no plano gratuito.

## Rodando no computador

Precisa do Node.js 24.

```sh
git clone https://github.com/gabriellyleitedev/plataforma-gestao-integrada.git
cd plataforma-gestao-integrada
npm ci
npm run dev
```

Abra http://localhost:5173. Localmente os dados ficam em `backend/data/platform.sqlite`.

| Comando | Para quê |
| --- | --- |
| `npm run dev` | Sobe o site e a API |
| `npm run check` | Formatação, lint, testes e build |
| `npm run test:e2e` | Testes no navegador |
| `npm run test:mysql` | Testes em um MySQL de verdade |

Mais detalhes na pasta [docs](docs): [instalação](docs/desenvolvimento-local.md), [manual de uso](docs/manual-do-usuario.md), [arquitetura](docs/arquitetura.md), [API](docs/integracao-api.md), [banco de dados](database/README.md) e [hospedagem](docs/hospedagem.md).

## Equipe

| Nome | GitHub | Parte |
| --- | --- | --- |
| Gabrielly dos Santos Leite | [gabriellyleitedev](https://github.com/gabriellyleitedev) | Infraestrutura |
| Vitor Vaz | [Vitor-Vaz-2009](https://github.com/Vitor-Vaz-2009) | Frontend |
| Raphael Nunes | [raphaelnsuzarte](https://github.com/raphaelnsuzarte) | Backend |
| Vinicius Bueno | [vini-bg](https://github.com/vini-bg) | Banco de dados |
| Joao Silva | [joaosilvaavitor-dot](https://github.com/joaosilvaavitor-dot) | Escopo e funcionalidades |

## Licença

[MIT](LICENSE)

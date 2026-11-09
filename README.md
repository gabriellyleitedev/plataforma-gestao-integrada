# Plataforma Web de Gestão Integrada

Desenvolvemos este projeto em grupo como Trabalho de Conclusão de Curso (TCC), com foco na gestão de micro e pequenas empresas.

## Apresentação e objetivo

Nosso objetivo é reunir as rotinas administrativas de pequenos negócios em uma plataforma web: clientes, catálogo, atendimentos, vendas, estoque e indicadores.

Atendemos comércios e prestadores de serviços. Separamos produtos de serviços para controlar o estoque apenas dos produtos. Detalhamos as funcionalidades no [escopo](docs/escopo.md).

No primeiro acesso, criamos a conta de administrador. Não usamos contas ou senhas padrão.

## Tecnologias

| Área | Tecnologias |
| --- | --- |
| Interface | React, Vite e React Router |
| Estilização | Tailwind CSS |
| API | Node.js e Express |
| Banco de dados | MySQL 8.4 LTS; SQLite como alternativa local de desenvolvimento |
| Modelagem | SQL e importação do schema no MySQL Workbench |
| Testes | Node.js Test Runner e Playwright |
| Qualidade e integração | ESLint e GitHub Actions |
| Versionamento | Git e GitHub, com branches e pull requests |
| Hospedagem | Vercel para interface, Render Free para API e TiDB Cloud Starter para MySQL |

Publicamos a aplicação em planos gratuitos:

- Interface: https://plataforma-gestao-integrada.vercel.app
- API: https://plataforma-gestao-api-hywk.onrender.com/api/health

No plano gratuito do Render, a API entra em repouso após 15 minutos sem uso, e o primeiro acesso seguinte leva cerca de um minuto. Para executar localmente, não dependemos dos provedores.

Para publicar a API, incluímos `render.yaml` com o plano gratuito: [configurar no Render](https://render.com/deploy?repo=https://github.com/gabriellyleitedev/plataforma-gestao-integrada). Preenchemos as credenciais do MySQL e a origem da Vercel no painel do serviço. Depois, configuramos `VITE_API_URL` na Vercel com a URL pública da API terminando em `/api` e fazemos um novo deploy.

## Acesso para avaliação

Disponibilizamos uma conta de demonstração no ambiente publicado para professores e convidados testarem o sistema.

| Campo | Valor |
| --- | --- |
| Endereço | https://plataforma-gestao-integrada.vercel.app |
| E-mail | `demo@integra.com` |
| Senha | `integra2026` |
| Perfil | Gestor |

Com essa conta, é possível cadastrar, editar e arquivar clientes, atendimentos, produtos, serviços, categorias e fornecedores, movimentar o estoque, registrar e cancelar vendas, consultar o dashboard e exportar relatórios. Apenas a gestão de usuários fica restrita aos administradores da equipe.

Todos os visitantes compartilham os mesmos dados de demonstração. Se o primeiro acesso demorar, aguardamos até um minuto enquanto a API gratuita sai do repouso.

## Funcionalidades disponíveis

- Login, logout, troca de senha e gestão de usuários com perfis administrador, gestor e operador.
- Cadastro, consulta, busca, edição e arquivamento de clientes, categorias, fornecedores, produtos, serviços e atendimentos.
- Entradas, saídas e ajustes de estoque, com motivo, responsável e histórico.
- Venda de múltiplos produtos e serviços, cálculo do total na API e baixa automática de produtos.
- Cancelamento de venda com devolução de estoque, sem apagar histórico.
- Dashboard com faturamento, vendas concluídas, ticket médio, clientes, gráfico diário, destaques e alerta de estoque.
- Relatórios por período, margem bruta estimada, valor atual de estoque e exportação CSV das vendas.

Trabalhamos com uma empresa por instalação, quantidades inteiras e valores monetários em centavos. Bloqueamos operações com estoque negativo.

## Início rápido

Usamos Node.js 24 LTS e npm 11. No desenvolvimento, salvamos os dados em SQLite, no arquivo `backend/data/platform.sqlite`. Para produção, usamos MySQL 8.4 LTS. Reunimos a configuração e a modelagem no [guia de banco](docs/mysql-local.md).

```sh
git clone https://github.com/gabriellyleitedev/plataforma-gestao-integrada.git
cd plataforma-gestao-integrada
npm ci
```

Na raiz, copiamos os exemplos de ambiente sem sobrescrever configurações existentes. No PowerShell:

```powershell
if (!(Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
npm.cmd run dev
```

No PowerShell, usamos `npm.cmd` quando encontramos bloqueio de `npm.ps1`. Nos demais terminais, usamos `npm`.

- Interface: http://localhost:5173
- Saúde da API: http://localhost:3001/api/health
- Resposta esperada: `{"status":"ok","service":"plataforma-gestao-integrada-api"}`

Também podemos iniciar com a configuração local padrão, sem `.env`. Na interface, criamos o administrador com nome, e-mail e senha de pelo menos 10 caracteres. Mantemos os registros entre reinícios e deixamos o banco fora do Git.

Para MySQL, definimos `DB_DRIVER=mysql` e preenchemos as variáveis `DB_*` com as credenciais da instalação. Inicializamos as tabelas ao iniciar a API, sem inserir registros de negócio. Ao trocar o driver, precisamos transferir os dados separadamente.

## Organização

```text
frontend/src/
  components/   Componentes reutilizáveis
  pages/        Páginas
  routes/       Rotas do navegador
  services/     Comunicação HTTP
  hooks/        Hooks React
  styles/       Tailwind e estilos globais
backend/src/
  routes/       Endpoints Express
  controllers/  Entrada e saída HTTP
  services/     Regras de aplicação
  repositories/ Consultas e persistência
  middlewares/  Tratamento transversal
  config/       Configuração de ambiente
  database/     Pool MySQL
database/
  scripts/      SQL de preparação
  migrations/   Evolução futura do schema
  modeling/     Orientação para DER e Workbench
docs/           Execução, arquitetura, integração, equipe e hospedagem
.github/        CI e modelos de issues/PRs
```

Organizamos o monorepo com npm workspaces e um único `package-lock.json`. Instalamos dependências na raiz com `npm install pacote -w frontend` ou `-w backend`.

## Comandos na raiz

| Comando | Uso |
| --- | --- |
| `npm run dev` | Frontend e backend com recarga |
| `npm run dev:frontend` | Apenas Vite |
| `npm run dev:backend` | Apenas API |
| `npm run check` | ESLint, testes de integração/persistência e build |
| `npm run test:e2e` | Fluxo real de formulários e navegação no Chrome, em banco isolado |
| `npm run test:mysql` | Fluxos de integração em uma instância MySQL de teste configurada |
| `npm run test:mysql:local` | Validação com pacote MySQL portátil, instalado conforme o guia |
| `npm run mysql:env` | Gera configuração privada para o MySQL opcional via Docker |
| `npm run build` | Gera `frontend/dist` |
| `npm run preview -w frontend` | Serve o build localmente; não inicia a API nem o proxy de desenvolvimento |
| `npm start` | Backend sem modo watch |
| `npm run db:check` | Inicializa o schema e verifica o banco selecionado com `SELECT 1` |

## Documentação

- [Execução local e solução de problemas](docs/desenvolvimento-local.md)
- [Manual de uso e permissões](docs/manual-do-usuario.md)
- [Conferência completa do escopo entregue](docs/entrega.md)
- [MySQL local, Docker, testes e Workbench](docs/mysql-local.md)
- [Arquitetura e padrões](docs/arquitetura.md)
- [Contrato da API](docs/integracao-api.md)
- [Equipe, branches e pull requests](docs/equipe-e-git.md)
- [Escopo e decisões pendentes](docs/escopo.md)
- [Hospedagem gratuita](docs/hospedagem.md)
- [Banco de dados](database/README.md)
- [Resultados e limites da validação](docs/validacao-inicial.md)
- [Contribuição](CONTRIBUTING.md)

## Autoria e equipe

Somos cinco integrantes e dividimos a documentação entre toda a equipe.

| Integrante | Nome | GitHub | Responsabilidade |
| --- | --- | --- | --- |
| 1 | Gabrielly dos Santos Leite | [gabriellyleitedev](https://github.com/gabriellyleitedev) | Infraestrutura |
| 2 | Vitor Vaz | [Vitor-Vaz-2009](https://github.com/Vitor-Vaz-2009) | Frontend |
| 3 | Raphael Nunes | [raphaelnsuzarte](https://github.com/raphaelnsuzarte) | Backend |
| 4 | Vinicius Bueno | [vini-bg](https://github.com/vini-bg) | Banco de dados |
| 5 | Joao Silva | A informar | Escopo e funcionalidades |

Compartilhamos as decisões, revisamos as alterações e integramos os módulos por pull requests. Descrevemos nosso fluxo em [Trabalho em equipe](docs/equipe-e-git.md) e [Como contribuir](CONTRIBUTING.md).

## Informações acadêmicas

| Informação | Preenchimento |
| --- | --- |
| Natureza do trabalho | Trabalho de Conclusão de Curso (TCC), em grupo |
| Instituição de ensino | Etec Itaquera II |
| Curso | Técnico em Desenvolvimento de Sistemas |
| Ano / semestre de apresentação | 2026, 2º semestre |

## Cuidados com o repositório

Mantemos credenciais, certificados privados e dados reais fora do repositório. Validamos o acesso na API, além da configuração de CORS.

## Licença

Distribuímos o projeto sob a [licença MIT](LICENSE).

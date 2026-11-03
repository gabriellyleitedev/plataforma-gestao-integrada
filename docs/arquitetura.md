# Arquitetura

Usamos React, Vite e Tailwind no frontend; Node.js e Express na API; MySQL na persistência. Para desenvolver sem instalar um servidor de banco, também oferecemos SQLite com `node:sqlite`. Mantemos JavaScript ESM em todo o projeto.

## Organização

Seguimos o fluxo página → hook → serviço HTTP → rota/controller → service → adaptador de banco.

- Concentramos chamadas HTTP e autenticação em `frontend/src/services/api.js`.
- Controlamos carregamento, erros e recarga em `useData`.
- Registramos as rotas e permissões em `management.controller.js`.
- Separamos autenticação, cadastros e operações de negócio nos services.
- Centralizamos consultas parametrizadas e transações em `database/store.js`, com o pool MySQL em `pool.js`.
- Reservamos `repositories/` para extrair consultas por módulo conforme o projeto crescer.
- Inicializamos o schema em `server.js` e testamos HTTP por `app.js`.

No desenvolvimento, encaminhamos `/api` pelo proxy do Vite. Na hospedagem, definimos a URL pública em `VITE_API_URL` e a origem permitida em `FRONTEND_URL`.

## Persistência e transações

No SQLite, usamos arquivo persistente, WAL, chaves estrangeiras e transações serializadas. No MySQL, reservamos uma conexão por transação e bloqueamos os saldos com `SELECT ... FOR UPDATE`. Bloqueamos os itens por ordem de identificador para reduzir deadlocks.

Armazenamos dinheiro em centavos e quantidades em unidades inteiras. Confirmamos venda, baixa de estoque e cancelamento em transações, sem permitir saldo negativo. Preservamos o histórico por arquivamento e cancelamento.

## Acesso

Protegemos senhas com scrypt e salt aleatório. Geramos tokens de sessão, armazenamos somente seus hashes no banco e limitamos a validade a oito horas. No navegador, usamos sessionStorage e removemos a sessão na saída ou após HTTP 401. Invalidamos sessões ao alterar senha, perfil ou ativação.

Aplicamos permissões na API, Helmet, limite de JSON de 100 KB e limitação de tentativas de login por IP. Não compartilhamos o contador de tentativas entre instâncias.

## Convenções

- Nomeamos componentes em PascalCase, hooks com `use` e funções em camelCase.
- Mantemos a interface em português e identificadores técnicos em inglês.
- Validamos os dados na API, além dos formulários.
- Usamos a integração `@tailwindcss/vite` e `@import "tailwindcss"`.
- Justificamos dependências novas no PR e atualizamos o lockfile da raiz.

Trabalhamos com uma empresa por instalação. Não implementamos múltiplas empresas no mesmo banco, MFA, recuperação por e-mail ou processamento de pagamentos.

# Integração da API

Usamos o prefixo `/api`, JSON e autenticação Bearer nas rotas privadas. Centralizamos as chamadas em `frontend/src/services/api.js` e o carregamento em `useData`.

## Acesso

| Método e caminho | Operação e dados |
| --- | --- |
| GET /health | Saúde HTTP; resposta `{ status: "ok", service: "plataforma-gestao-integrada-api" }` |
| GET /setup | Consulta de `needsSetup` e `storage` |
| POST /setup | Primeiro administrador: `{ name, email, password }` |
| POST /auth/login | Entrada: `{ email, password }`; resposta `{ token, user }` |
| GET /auth/me | Dados da conta autenticada |
| POST /auth/logout | Encerramento da sessão |
| PUT /auth/password | Troca de senha: `{ current_password, password }` |

Criamos somente um administrador inicial. Usamos senhas de 10 a 128 caracteres e sessões de oito horas. Enviamos o token em `Authorization: Bearer TOKEN`. Invalidamos as sessões ao trocar a senha.

## Cadastros

Disponibilizamos GET e POST em `/clients`, `/suppliers`, `/categories`, `/items` e `/appointments`; PUT e DELETE em cada recurso com `/:id`. Usamos DELETE para arquivar, preservando os vínculos históricos.

| Recurso | Campos |
| --- | --- |
| clients / suppliers | name obrigatório; email, phone, document e notes opcionais |
| categories | name obrigatório; description opcional |
| items | name, type (product/service), price_cents; cost_cents, sku, description, category_id, supplier_id e stock_minimum opcionais |
| appointments | client_id, subject, scheduled_at ISO; status e notes |

Recebemos IDs positivos, centavos inteiros não negativos e vínculos opcionais como null. Exigimos os campos completos na edição. Inicializamos produtos com estoque zero e alteramos o saldo somente por movimentações.

Em `/users`, disponibilizamos GET e POST; em `/users/:id`, PUT. Restringimos essas operações ao administrador. Recebemos name, email, role e password na criação; na edição, active booleano e password opcional. Trabalhamos com admin, manager e operator.

## Estoque e vendas

| Método e caminho | Operação e dados |
| --- | --- |
| GET /stock/movements | Histórico de movimentos e responsáveis |
| POST /stock/movements | `{ item_id, type, quantity, reason }`; type entry, exit ou adjustment |
| GET /sales | Listagem de vendas |
| GET /sales/:id | Detalhes e itens com valores históricos |
| POST /sales | `{ client_id, payment_method, notes, items: [{ item_id, quantity }] }` |
| POST /sales/:id/cancel | Cancelamento com `{ reason }` |
| GET /reports?from=AAAA-MM-DD&to=AAAA-MM-DD | Indicadores e vendas do período |

Em ajustes, recebemos o saldo final; nas demais movimentações, uma quantidade positiva. Aceitamos até 100 itens distintos por venda e calculamos o total pelo catálogo. Para pagamento, usamos pix, cash, credit, debit ou other.

Restringimos catálogo, estoque, fornecedores, categorias e cancelamentos a administrador ou gestor. Permitimos ao operador consultar módulos, cadastrar clientes/atendimentos e registrar vendas. Agrupamos os relatórios em UTC e excluímos cancelamentos do faturamento. Retornamos listas completas nesta versão; precisaremos de paginação para grandes volumes.

## Respostas

Retornamos HTTP 201 na criação e 200 nas demais operações bem-sucedidas. Para erros, usamos `{ error: { code, message } }`, sem credenciais ou stack trace.

| Status | Situação |
| --- | --- |
| 400 | Validação ou JSON inválido |
| 401 / 403 | Sessão inválida ou permissão insuficiente |
| 404 | Registro ou rota ausente |
| 409 | Conflito de dados, saldo ou estado |
| 413 | JSON acima de 100 KB |
| 429 | Limite de tentativas de login |
| 500 | Falha interna |

# Requisitos e verificação

## Requisitos funcionais

| Requisito informado | Implementação | Conferência |
| --- | --- | --- |
| Clientes | Cadastro, busca, edição e arquivamento | API e navegador |
| Atendimentos | Cliente, responsável, assunto, agendamento, observações e situação | API e navegador |
| Produtos e serviços | Catálogo, preços/custos, tipos, categorias e fornecedores | API e navegador |
| Categorias e fornecedores | Cadastro, edição, busca e arquivamento | API e navegador |
| Estoque | Entradas, saídas e ajustes com motivo, saldo e responsável | API e navegador |
| Vendas | Múltiplos itens, pagamento, total calculado no servidor e baixa de produtos | API e navegador |
| Cancelamento | Motivo obrigatório, devolução de produtos, histórico e proteção contra repetição | API e navegador |
| Dashboard | Faturamento, vendas, ticket médio, clientes, gráfico diário e estoque mínimo | API e navegador |
| Relatórios | Período, vendas, margem bruta estimada, estoque atual e CSV | API e navegador |
| Login e acesso | Administrador, gestor, operador, sessões, saída, senha e usuários ativos/inativos | API e navegador |

## Requisitos técnicos

| Requisito | Arquivos ou diretórios |
| --- | --- |
| Monorepo | `package.json`, `package-lock.json`, workspaces frontend/backend |
| React + Vite | `frontend/package.json`, `frontend/vite.config.js`, `frontend/src/` |
| Tailwind CSS | Plugin Vite e `frontend/src/styles/index.css` |
| Node.js + Express | `backend/src/app.js`, `backend/src/server.js` |
| MySQL | `backend/src/database/pool.js`, `store.js` e `database/migrations/001-schema.mysql.sql` |
| Modelagem | SQL importável pelo Workbench, dicionário e guia em `database/modeling/` |
| Configuração sem credenciais versionadas | Exemplos `.env.example`, `.gitignore` e gerador opcional de senhas locais |
| Integração inicial | `/api/health`, proxy Vite e serviço HTTP com autenticação |
| Equipe de cinco integrantes | `docs/equipe-e-git.md`, `CONTRIBUTING.md`, modelos de issue/PR |
| Execução e integração | README, manual, guias local/API/arquitetura |
| Verificações | Testes de API, persistência, concorrência, MySQL e navegador; jobs separados de CI |
| Hospedagem sem custo | Configuração Vercel, instruções Render Free/TiDB Cloud Starter |

## Resultado da validação

- Lint sem erros ou avisos; build de produção concluído.
- 22 testes no conjunto padrão, incluindo configuração da URI MySQL, persistência e concorrência.
- 14 testes do fluxo de gestão pela função da Vercel, em ambiente local isolado.
- 14 testes do fluxo integrado executados contra MySQL Community 8.4.13 real, em banco temporário isolado.
- Fluxo Playwright no Chrome em desktop/celular, com cadastros, estoque, venda, cancelamento, dashboard, CSV e permissões.
- Nenhum teste insere registros no banco usado pelo usuário.

## Limites e configuração externa

Usamos SQLite no desenvolvimento e validamos os mesmos fluxos em MySQL. Para configurar MySQL, seguimos `database/README.md`. Ao mudar de driver, planejamos a transferência dos dados separadamente.

Publicamos a interface na Vercel, a API no Render e o banco no TiDB Cloud Starter, todos em planos gratuitos. Mantemos os endereços e as instruções em `docs/hospedagem.md`.

Para gerar o modelo `.mwb`, importamos o SQL no Workbench e revisamos os relacionamentos. Não incluímos emissão fiscal, processamento de pagamentos ou recuperação de senha por e-mail.

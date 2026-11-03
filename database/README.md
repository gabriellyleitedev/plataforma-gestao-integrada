# Banco de dados

Usamos MySQL 8.4 LTS e mantemos o schema em `migrations/001-schema.mysql.sql`. Para desenvolver sem servidor de banco, também usamos SQLite no arquivo `backend/data/platform.sqlite`. Inicializamos as tabelas ao abrir a API e criamos o primeiro administrador pela interface.

## Configuração

1. Criamos o banco com `scripts/001-create-database.sql` e configuramos um usuário autorizado.
2. Preenchemos `backend/.env` com `DB_DRIVER=mysql` e as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD`.
3. Executamos `npm run db:check` e iniciamos a API.

Precisamos de permissão para criar as tabelas e ler/gravar os registros. Para banco remoto, ativamos TLS com validação. Detalhamos as opções em [MySQL local](../docs/mysql-local.md).

No desenvolvimento com SQLite, mantemos o arquivo fora do Git. Para backup, paramos a API e copiamos o arquivo. Ao mudar de driver, planejamos a transferência dos dados separadamente.

## Organização

- Guardamos a preparação do banco em `scripts/`.
- Mantemos o schema inicial e futuras alterações em `migrations/`.
- Documentamos o modelo e o [dicionário de dados](modeling/dicionario-dados.md) em `modeling/`.

## Tabelas

| Tabela | Conteúdo |
| --- | --- |
| users / sessions | Usuários, hashes, perfis e sessões |
| clients | Clientes e contatos |
| categories / suppliers | Categorias e fornecedores |
| items | Catálogo, preços, custos e saldos |
| appointments | Atendimentos e agenda |
| sales / sale_items | Vendas e valores históricos dos itens |
| stock_movements | Variação, saldo final, motivo e responsável |
| setup_lock | Bloqueio da criação do primeiro administrador |

Usamos chaves estrangeiras, consultas parametrizadas e transações. Arquivamos cadastros e cancelamos vendas sem apagar histórico. Não permitimos saldo negativo.

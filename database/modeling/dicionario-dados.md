# Dicionário de dados

Mantemos tipos, tamanhos e nulabilidade em `database/migrations/001-schema.mysql.sql`. Separamos os dados por negócio com `company_id`.

## Convenções

- `id`: chave primária inteira com incremento automático, exceto sessões.
- `created_at`, `expires_at`, `scheduled_at`, `cancelled_at`: texto ISO 8601 em UTC; `cancelled_at` pode ser nulo.
- `archived`: inteiro 0/1; remove dos cadastros ativos sem apagar histórico.
- `*_cents`: inteiro de centavos, nunca valor monetário em ponto flutuante.
- Quantidades/saldos: inteiros em unidades. Validações e limites são aplicados pela API.

| Tabela | Campos e finalidade | Relacionamentos |
| --- | --- | --- |
| companies | id; name (160); created_at | Um negócio possui usuários, cadastros, vendas e movimentos |
| users | id; company_id; name (160); email (190, único); password_hash (255, scrypt + salt); role (admin/manager/operator); active (0/1); created_at | Um usuário possui sessões e pode registrar vendas, atendimentos e movimentos |
| sessions | token_hash (64, chave primária SHA-256); user_id; expires_at | N sessões para um usuário |
| clients | id; company_id; name (160); email (190); phone (40); document (40); notes (texto); archived; created_at | Um cliente pode ter vendas e atendimentos |
| categories | id; company_id; name (160); description (texto); archived; created_at | Uma categoria pode classificar vários itens |
| suppliers | id; company_id; name (160); email (190); phone (40); document (40); notes (texto); archived; created_at | Um fornecedor pode estar ligado a vários produtos |
| items | id; company_id; name (160); type (product/service); sku (80); description; price_cents; cost_cents; category_id e supplier_id opcionais; stock_minimum; stock; archived; created_at | Item pertence opcionalmente a categoria/fornecedor; pode participar de vendas; produtos têm movimentos |
| sales | id; company_id; client_id opcional; user_id; total_cents; payment_method; status (completed/cancelled); notes; created_at; cancelled_at opcional | Uma venda possui itens e pode gerar movimentos |
| sale_items | id; sale_id; item_id; name e type históricos; quantity; price_cents e cost_cents históricos | N itens para uma venda; preserva preço/custo e nome do momento da operação |
| stock_movements | id; company_id; item_id; user_id; sale_id opcional; type; quantity assinada; balance_after; reason (500); created_at | Movimento pertence a produto e responsável; vínculo com venda quando aplicável |
| appointments | id; company_id; client_id; user_id; subject (160); notes; scheduled_at; status; archived; created_at | Atendimento pertence a cliente e responsável |

## Domínios e integridade

- Pagamento: pix, cash, credit, debit ou other. Registra o meio, sem processar cobrança.
- Movimento: entry, exit, adjustment, sale ou return. `quantity` positiva soma; negativa subtrai. Em ajustes, o formulário recebe saldo final e o histórico guarda a diferença.
- Atendimento: open, in_progress, completed ou cancelled.
- Validamos perfis na API e não expomos hashes ou tokens nas listagens.
- Arquivamos cadastros e cancelamos vendas para preservar o histórico.
- Mantemos venda/cancelamento e seus efeitos no estoque na mesma transação; bloqueamos os saldos com `FOR UPDATE` no MySQL.
- Não movimentamos serviços nem alteramos o tipo de itens com histórico.
- Usamos chaves estrangeiras nos vínculos e evitamos exclusões em cascata do histórico.

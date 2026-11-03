# Escopo

## Objetivo e público-alvo

Desenvolvemos uma plataforma web para reunir a gestão de clientes, catálogo, atendimentos, vendas, estoque e indicadores. Nosso público-alvo são micro e pequenos negócios, incluindo comércios e prestadores de serviços.

## Funcionalidades

| Módulo | O que implementamos |
| --- | --- |
| Clientes | Cadastro, consulta, busca, edição e arquivamento |
| Produtos e serviços | Catálogo com preço, custo, tipo, categoria e fornecedor |
| Categorias e fornecedores | Cadastros e vínculos com o catálogo |
| Atendimentos | Cliente, responsável, assunto, data, situação e observações |
| Estoque | Entradas, saídas e ajustes com histórico e motivo |
| Vendas | Itens, pagamento, total, baixa de produtos e cancelamento |
| Dashboard | Faturamento, vendas, ticket médio, clientes, gráfico e alertas |
| Relatórios | Período, margem estimada, estoque atual e exportação CSV |
| Acesso | Login, sessões, troca de senha e perfis de usuário |

## Regras

- Trabalhamos com uma empresa por instalação.
- Usamos quantidades inteiras e valores em centavos.
- Iniciamos produtos com saldo zero e movimentamos somente por estoque, venda ou cancelamento.
- Não movimentamos estoque de serviços.
- Calculamos preços e totais da venda na API e guardamos preço e custo históricos.
- Bloqueamos saldo negativo e confirmamos as operações em transações.
- Arquivamos cadastros para preservar vínculos; exigimos saldo zero para arquivar produtos.
- Excluímos vendas canceladas do faturamento e devolvemos seus produtos uma única vez.
- Agrupamos vendas por data UTC e indicamos esse critério na interface.
- Mostramos saldo e valor de estoque atuais, independentemente do período de vendas.

## Próximas definições

Precisamos confirmar os dados acadêmicos, o sexto integrante, os revisores, a licença e os responsáveis pela hospedagem. Para evoluir o sistema, revisaremos a necessidade de quantidades fracionadas, outras permissões e recuperação de senha por e-mail.

Não incluímos emissão fiscal, processamento de pagamentos, contabilidade ou múltiplas empresas no mesmo banco.

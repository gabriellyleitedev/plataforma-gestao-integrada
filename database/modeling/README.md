# Modelagem no MySQL Workbench

Mantemos o schema em `database/migrations/001-schema.mysql.sql` e os campos no [dicionário de dados](dicionario-dados.md).

Para gerar o modelo, abrimos File → Import → Reverse Engineer MySQL Create Script no Workbench, selecionamos o SQL e revisamos os relacionamentos. Depois, salvamos `plataforma-gestao-integrada.mwb` e exportamos o DER.

Relacionamos clientes a vendas e atendimentos; categorias e fornecedores a itens; vendas a itens de venda e movimentações; usuários a sessões e operações. Não geramos movimentações para serviços.

Revisamos o modelo e a exportação SQL em conjunto antes de alterar o schema compartilhado.

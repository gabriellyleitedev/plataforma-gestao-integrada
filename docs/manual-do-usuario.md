# Manual de uso

## Acesso

No primeiro acesso, criamos o administrador com nome, e-mail e senha. Depois, entramos com essa conta e cadastramos os demais usuários. Para trocar nossa senha, clicamos no nome no topo, informamos a senha atual e confirmamos a nova. Após a troca, entramos novamente. Encerramos a sessão pelo botão de saída.

## Cadastros

Acessamos Clientes, Categorias, Fornecedores ou Produtos e serviços para cadastrar, buscar e editar registros. Ao arquivar, retiramos o cadastro da lista ativa e preservamos seus vínculos históricos.

No catálogo, informamos preço e custo em reais, com até duas casas decimais. Separamos produtos de serviços: iniciamos produtos com saldo zero e registramos a primeira entrada no estoque; não atribuímos estoque ou fornecedor aos serviços. Definimos o mínimo para acompanhar a reposição.

## Estoque

Em Nova movimentação, selecionamos produto, tipo, quantidade e motivo. Para entrada, somamos unidades; para saída, subtraímos. Em ajuste, informamos o saldo final contado. Consultamos a variação, o saldo após a operação, a data e o responsável no histórico. Não permitimos saldo negativo.

## Vendas

Em Nova venda, escolhemos o cliente ou consumidor não identificado, o meio de pagamento e os itens do catálogo. Ajustamos as quantidades e confirmamos. Conferimos os preços na API e baixamos somente os produtos do estoque.

Em Ver detalhes, consultamos itens, valores históricos, responsável e data. Com perfil de administrador ou gestor, cancelamos a venda com motivo e devolvemos os produtos ao estoque. Mantemos a venda no histórico e retiramos seus valores dos indicadores.

Registramos o meio de pagamento, mas não processamos cobranças nem emitimos documentos fiscais.

## Atendimentos

Selecionamos cliente, assunto, data/hora, situação e observações. Atualizamos o andamento pela edição, entre aberto, em andamento, concluído ou cancelado. Não enviamos mensagens ou lembretes automaticamente.

## Dashboard e relatórios

Selecionamos as datas e usamos Aplicar período. Consultamos faturamento, vendas concluídas, ticket médio, margem estimada e gráfico. Agrupamos as vendas em UTC e mostramos os horários individuais no fuso do navegador.

Mostramos clientes, alertas e valor de estoque na situação atual. Na margem bruta, consideramos preço menos custo da venda, sem despesas, impostos ou tarifas. Exportamos as vendas do período em CSV, incluindo sua situação.

## Permissões

| Operação | Administrador | Gestor | Operador |
| --- | --- | --- | --- |
| Consultar módulos e relatórios | Sim | Sim | Sim |
| Gerenciar clientes e atendimentos | Sim | Sim | Sim |
| Registrar vendas | Sim | Sim | Sim |
| Editar catálogo, categorias e fornecedores | Sim | Sim | Não |
| Movimentar estoque e cancelar vendas | Sim | Sim | Não |
| Gerenciar usuários | Sim | Não | Não |
| Trocar a própria senha | Sim | Sim | Sim |

Validamos as permissões na API e recusamos acesso de contas inativas. Invalidamos as sessões ao alterar uma conta.

## Dados

No modo local, salvamos os registros em `backend/data/platform.sqlite` e os mantemos entre reinícios. Para trabalhar sobre os mesmos dados em computadores diferentes, precisamos configurar uma API e um banco MySQL comuns. Não transferimos os registros automaticamente ao mudar o driver; seguimos o [guia do banco](../database/README.md).

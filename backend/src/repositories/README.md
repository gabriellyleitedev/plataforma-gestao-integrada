# Repositórios

Centralizamos consultas e transações em `../database/store.js`, com pool MySQL em `../database/pool.js`. Reservamos este diretório para extrair as consultas dos services por módulo conforme o projeto crescer.

Usamos parâmetros para os valores das consultas e mantemos cada operação de venda ou estoque na mesma conexão transacional.

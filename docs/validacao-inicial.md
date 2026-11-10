# Validação

Executamos as verificações com Node.js 24.16.0 e npm 11.13.0.

| Comando | Resultado |
| --- | --- |
| `npm run check` | Lint sem avisos, 22 testes aprovados e build concluído |
| `npm run test:vercel` | 14 testes do fluxo de gestão pela função Vercel, em ambiente local isolado |
| `npm run test:mysql:local` | 14 testes aprovados em MySQL Community 8.4.13 |
| `npm run test:e2e` | Fluxo completo aprovado no Chrome, em desktop e celular |

## Cobertura

- Verificamos cadastro inicial, login, logout, perfis e troca de senha.
- Conferimos validações, vínculos e arquivamento dos cadastros.
- Testamos entradas, saídas, ajustes, venda mista e cancelamento.
- Disputamos a última unidade com duas vendas simultâneas: confirmamos uma e recusamos a outra sem deixar saldo negativo.
- Conferimos faturamento, margem, ticket médio e histórico.
- Reiniciamos um processo para verificar a persistência em arquivo.
- Testamos os formulários, CSV, menu no celular e acesso com a senha alterada no navegador.

Usamos bancos em memória ou temporários nos testes. Preservamos os dados da aplicação e mantemos o pacote MySQL e suas credenciais fora do Git, em `.local/`.

## Observações

Na auditoria de dependências, identificamos seis avisos moderados na árvore de desenvolvimento do ESLint/minimatch e nenhum nas dependências de execução. Não aplicamos atualizações forçadas de versão principal. Acompanhamos esse resultado com `npm audit`.

Validamos MySQL localmente, mas mantemos SQLite como opção de desenvolvimento. Para a publicação, precisamos configurar MySQL, HTTPS e as variáveis dos provedores conforme o [guia de hospedagem](hospedagem.md).

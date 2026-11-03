# Como contribuímos

Seguimos os guias de [desenvolvimento local](docs/desenvolvimento-local.md) e [trabalho em equipe](docs/equipe-e-git.md).

1. Combinamos a issue, o responsável e o contrato afetado.
2. Criamos uma branch curta a partir da `main` atualizada.
3. Mantemos o PR focado e documentamos mudanças de ambiente, API ou SQL.
4. Executamos `npm run check` e descrevemos os testes.
5. Solicitamos revisão de outro integrante antes de integrar.

Não enviamos `.env`, credenciais, dumps reais, `node_modules` ou `dist`. Atualizamos o lockfile da raiz junto das dependências e envolvemos o responsável pelo banco nas alterações de schema.

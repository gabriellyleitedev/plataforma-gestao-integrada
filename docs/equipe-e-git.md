# Trabalho em equipe

Dividimos o projeto nas frentes abaixo. Ainda precisamos confirmar o responsável por documentação e os revisores.

| Integrante | Responsabilidade | Área |
| --- | --- | --- |
| Gabrielly dos Santos Leite | Infraestrutura | Raiz e `.github/` |
| Vitor Vaz | Frontend | `frontend/src/` |
| Raphael Nunes | Backend | `backend/src/` |
| Vinicius Bueno | Banco de dados | `database/` |
| Joao Silva | Escopo e funcionalidades | `docs/escopo.md` e issues |
| A informar | Documentação | `docs/` e README |

## Fluxo de contribuição

1. Abrimos uma issue com objetivo, responsável e critérios de aceite.
2. Atualizamos a `main` e criamos uma branch curta para a tarefa.
3. Combinamos alterações em contratos, schema e arquivos compartilhados.
4. Executamos `npm run check`, revisamos o diff e abrimos um PR.
5. Pedimos revisão de outro integrante; envolvemos os responsáveis em mudanças de API e banco.
6. Integramos após as verificações e atualizamos as branches antes de continuar.

```sh
git switch main
git pull --ff-only origin main
git switch -c feat/nome-da-tarefa
```

Usamos prefixos como `feat/`, `fix/`, `docs/` e `chore/`. Evitamos branches permanentes por pessoa e combinamos mudanças no lockfile. Após atualizar dependências, executamos `npm ci`.

## Configuração do GitHub

Precisamos confirmar os convites da equipe, os revisores e a proteção da `main`. Adotamos PR, revisão e CI para as próximas alterações. Mantemos modelos de issue e PR em `.github/`.

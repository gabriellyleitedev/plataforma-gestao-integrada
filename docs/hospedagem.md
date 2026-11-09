# Hospedagem

Publicamos a aplicação somente em planos gratuitos, sem cartão cadastrado.

| Parte | Provedor | Endereço |
| --- | --- | --- |
| Interface | Vercel | https://plataforma-gestao-integrada.vercel.app |
| API | Render Free, região Virginia | https://plataforma-gestao-api-hywk.onrender.com |
| Banco | TiDB Cloud Starter, AWS `us-east-1` | Acesso restrito à API |

## Frontend na Vercel

Importamos o repositório, selecionamos `frontend` como Root Directory e escolhemos o preset Vite. Usamos o lockfile da raiz e habilitamos o acesso aos arquivos externos à Root Directory quando necessário.

| Configuração | Valor |
| --- | --- |
| Build | `npm run build` |
| Saída | `dist` |
| Variável pública | `VITE_API_URL`, com a URL HTTPS real da API terminando em `/api` |

Mantemos o fallback das rotas em `frontend/vercel.json`.

## API no Render Free

Incluímos `render.yaml` para importar a configuração pelo [Deploy to Render](https://render.com/deploy?repo=https://github.com/gabriellyleitedev/plataforma-gestao-integrada). Selecionamos o plano gratuito e preenchemos os valores privados no painel, sem adicioná-los ao Git.

Criamos um Web Service Node.js com a raiz do monorepo e o plano Free.

| Configuração | Valor |
| --- | --- |
| Build | `npm ci --workspace backend --include-workspace-root=false --omit=dev` |
| Start | `npm start -w backend` |
| Health | `/api/health` |
| Node.js | 24 |
| Ambiente | `NODE_ENV=production` e `DB_DRIVER=mysql` |
| Origem permitida | `FRONTEND_URL`, com a origem HTTPS real da interface |

Usamos o `PORT` fornecido pela plataforma. Configuramos as credenciais `DB_*` somente no painel privado. Após publicar, criamos o administrador pela interface. Não usamos SQLite no disco efêmero do serviço.

Consideramos a suspensão por inatividade e as cotas do [plano gratuito do Render](https://render.com/docs/free). Para MySQL, usamos um provedor separado.

## MySQL no TiDB Cloud Starter

Usamos o [TiDB Cloud Starter](https://docs.pingcap.com/tidbcloud/serverless-limitations/), compatível com MySQL e gratuito sem prazo de expiração. Criamos a instância na AWS `us-east-1`, próxima da API, e mantemos o limite de gastos em US$ 0. Validamos os 14 fluxos de `npm run test:mysql` nessa instância.

| Variável | Valor |
| --- | --- |
| `DB_HOST` | Host público exibido em Connect |
| `DB_PORT` | `4000` |
| `DB_NAME` | `plataforma_gestao_integrada` |
| `DB_USER` | Usuário exibido em Connect, com o prefixo da instância |
| `DB_SSL` | `true`, sem CA adicional |

Mantemos a validação TLS. O certificado do TiDB Cloud é emitido por uma autoridade pública, então não preenchemos `DB_SSL_CA`. Não colocamos credenciais em `VITE_*`.

Em banco já provisionado, inicializamos as tabelas do schema com o usuário autorizado. Para transferir uma instalação local, planejamos o backup e a migração separadamente.

## Conferência

1. Conferimos a resposta de `/api/health`.
2. Entramos na interface e testamos cadastros e uma operação completa.
3. Conferimos HTTPS, CORS, conexão com o banco e acesso direto às rotas.
4. Revisamos cotas e evitamos habilitar planos pagos ou upgrades automáticos.

Se encontrarmos HTTP 404 em `/api/setup` na Vercel, conferimos se publicamos a API e configuramos `VITE_API_URL` com sua URL HTTPS terminando em `/api`. Depois de alterar a variável, fazemos um novo deploy para incorporar o valor no frontend.

Se não conseguirmos um plano gratuito compatível, mantemos a apresentação local até definirmos outra opção.

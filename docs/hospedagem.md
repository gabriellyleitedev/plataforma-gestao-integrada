# Hospedagem

Planejamos usar planos gratuitos e conferir os limites antes da publicação. Ainda não provisionamos serviços em nuvem.

Para a configuração mais curta, seguimos o [guia Vercel](vercel.md): publicamos interface e API no mesmo projeto e conectamos MySQL pelas variáveis privadas. A configuração Render abaixo permanece como alternativa.

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

## MySQL no Aiven Free

Consideramos o [plano gratuito do Aiven](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier). Antes de criar o serviço, conferimos disponibilidade e limites na conta.

Configuramos host, porta, banco, usuário e senha no backend. Ativamos `DB_SSL=true` e mantemos a validação TLS. Se precisarmos da CA do provedor, colamos o PEM em `DB_SSL_CA` ou indicamos um arquivo em `DB_SSL_CA_PATH`. Não colocamos credenciais em `VITE_*`.

Em banco já provisionado, inicializamos as tabelas do schema com o usuário autorizado. Para transferir uma instalação local, planejamos o backup e a migração separadamente.

## Conferência

1. Conferimos a resposta de `/api/health`.
2. Entramos na interface e testamos cadastros e uma operação completa.
3. Conferimos HTTPS, CORS, conexão com o banco e acesso direto às rotas.
4. Revisamos cotas e evitamos habilitar planos pagos ou upgrades automáticos.

Se encontrarmos HTTP 404 em `/api/setup` na Vercel, conferimos se publicamos a API e configuramos `VITE_API_URL` com sua URL HTTPS terminando em `/api`. Depois de alterar a variável, fazemos um novo deploy para incorporar o valor no frontend.

Se não conseguirmos um plano gratuito compatível, mantemos a apresentação local até definirmos outra opção.

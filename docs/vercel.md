# Publicação na Vercel

Usamos o mesmo projeto para a interface e a API. Mantemos MySQL no banco e Workbench na modelagem; não precisamos do Render nesta opção.

## Configuração do projeto

- Root Directory: `frontend`.
- Framework Preset: Vite.
- Build Command: `npm run build`.
- Output Directory: `dist`.
- Node.js: 24.x.
- Mantemos habilitada a inclusão dos arquivos fora da Root Directory, pois importamos o backend do monorepo.

## Variáveis

Em Settings → Environment Variables, copiamos o bloco abaixo para Production:

```dotenv
DB_DRIVER=mysql
DATABASE_URL=
DB_SSL=true
DB_SSL_CA=
VITE_API_URL=/api
```

Preenchemos `DATABASE_URL` com a URI MySQL completa fornecida pelo serviço de banco. Não usamos a URL de um painel nem uma conexão PostgreSQL.

Em `DB_SSL_CA`, colamos o certificado CA em PEM fornecido pelo banco, com BEGIN e END. Podemos cadastrar esse campo separadamente para preservar as quebras de linha. Mantemos usuário e senha somente nas variáveis privadas, nunca em `VITE_*` ou no Git.

Podemos criar MySQL no [plano gratuito do Aiven](https://aiven.io/free-mysql-database). Precisamos criar esse serviço na conta do responsável antes de preencher a conexão. A API não cria contas em provedores nem hospeda o banco dentro da Vercel.

Se usarmos uma conexão com certificado público reconhecido pelo Node.js, podemos deixar `DB_SSL_CA` vazio. No Aiven, usamos a CA apresentada no painel quando exigida pela conexão.

## Deploy e conferência

Após salvar as variáveis, executamos Redeploy. Conferimos `/api/health` no mesmo domínio da interface e depois abrimos o site para criar o administrador.

Com 404 em `/api/setup`, conferimos se o deploy já inclui `frontend/api/[...path].js`. Com 503, conferimos os dados do banco e TLS. Sem um banco configurado, podemos publicar a interface, mas não criar contas nem usar os cadastros.

Mantemos `render.yaml` como alternativa para hospedar a API separadamente. Nessa opção, substituímos `VITE_API_URL` pela URL pública do Render terminando em `/api`.

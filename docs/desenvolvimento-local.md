# Desenvolvimento local

## Preparação

1. Instalamos Node.js 24 LTS, npm 11 e Git.
2. Clonamos o repositório e executamos `npm ci` na raiz.
3. Copiamos os exemplos de ambiente para `.env` em frontend e backend, sem sobrescrever configurações existentes.
4. Executamos `npm run dev`.
5. Acessamos http://localhost:5173 e criamos uma conta em **Criar conta**. Para encerrar, usamos Ctrl+C.

No PowerShell com bloqueio de scripts, usamos `npm.cmd` no lugar de `npm`, sem alterar a política do computador.

Por padrão, salvamos os dados em `backend/data/platform.sqlite`. Para trabalhar com MySQL, definimos `DB_DRIVER=mysql` e as credenciais em `backend/.env`, conforme o [guia MySQL](mysql-local.md). Ao trocar de driver, precisamos transferir os dados separadamente.

## Trabalho por área

| Área | Execução |
| --- | --- |
| Frontend | `npm run dev:frontend` |
| Backend | `npm run dev:backend` |
| Banco | `npm run db:check` |
| Documentação e escopo | Edição dos arquivos, sem servidor |

Conferimos a API em http://localhost:3001/api/health. Inicializamos o schema antes de abrir a porta, mas não consultamos o banco pelo health.

## Primeiro uso

1. Criamos o administrador e as contas da equipe.
2. Cadastramos clientes, categorias, fornecedores e catálogo.
3. Registramos uma entrada para os produtos, inicialmente com saldo zero.
4. Montamos e confirmamos a venda.
5. Conferimos saldo e indicadores. Para cancelar, acessamos os detalhes da venda com perfil de administrador ou gestor.

Detalhamos as operações no [manual de uso](manual-do-usuario.md).

## Verificações

Executamos `npm run check` antes de abrir um PR. Para testar os formulários, instalamos Chrome e executamos `npm run test:e2e`. Usamos portas 3101 e 5179 e banco em memória, sem alterar os dados locais. Para outro canal de navegador, configuramos `PLAYWRIGHT_CHANNEL`.

Para validar MySQL, seguimos `npm run test:mysql` ou a opção portátil descrita no guia. No CI, separamos qualidade/build, MySQL e navegador em três jobs.

Para conferir `npm run preview -w frontend`, definimos a URL absoluta da API em `VITE_API_URL` antes do build e ajustamos `FRONTEND_URL` para a origem do preview. Usamos o proxy somente no servidor de desenvolvimento.

## Problemas comuns

| Situação | Como conferimos |
| --- | --- |
| Porta ocupada | Encerramos nossa execução anterior, preservando processos de outros projetos |
| API em outra porta | Ajustamos `PORT` e `API_PROXY_TARGET` |
| Frontend em outra origem | Ajustamos `FRONTEND_URL` e a porta do Vite |
| Alteração de ambiente sem efeito | Reiniciamos os servidores; para Vite em produção, geramos novo build |
| Conexão MySQL recusada | Conferimos serviço, host, porta, banco, usuário e permissões |
| Erro TLS | Configuramos `DB_SSL=true` e a CA do provedor, mantendo a validação ativa |

Mantemos credenciais somente no backend. Tratamos `VITE_*` como configuração pública.

# MySQL local

## Instalação existente

1. Iniciamos MySQL 8.4 LTS e criamos o banco com `database/scripts/001-create-database.sql`.
2. Definimos `DB_DRIVER=mysql` e as credenciais em `backend/.env`.
3. Executamos `npm run db:check` e `npm run dev`.

Inicializamos as tabelas na abertura da API e criamos o administrador pela interface. Não usamos a conta do servidor MySQL para entrar na aplicação.

## Docker

Com Docker Engine e Compose, executamos na raiz:

```sh
npm run mysql:env
docker compose --env-file database/.env up -d mysql
```

Geramos senhas aleatórias em `database/.env` sem sobrescrever um arquivo existente. Copiamos os campos `DB_*` para `backend/.env`, definimos `DB_DRIVER=mysql` e mantemos a senha de root fora da aplicação. Usamos um volume persistente e acesso por 127.0.0.1.

Para parar sem remover o volume:

```sh
docker compose --env-file database/.env stop mysql
```

Preparamos essa opção, mas não a validamos localmente por falta de Docker. Validamos o banco com o pacote portátil oficial.

## Teste de integração

Configuramos `TEST_MYSQL_HOST`, `TEST_MYSQL_PORT`, `TEST_MYSQL_USER` e `TEST_MYSQL_PASSWORD` para uma instância local de teste, com permissão de criar e remover bancos. Executamos:

```sh
npm run test:mysql
```

Criamos um banco aleatório com prefixo `pgi_test_`, executamos os fluxos HTTP e removemos somente esse banco ao terminar. Não usamos o banco de negócio definido em `DB_NAME`. Reservamos esse runner para testes locais sem TLS.

## Pacote portátil

Validamos MySQL Community 8.4.13, com download e checksum da [Oracle](https://dev.mysql.com/downloads/mysql/8.4.html). Para repetir, extraímos o pacote em `.local/mysql-8.4.13-winx64` ou configuramos `MYSQL_BINARY_DIR`.

```sh
npm run test:mysql:local
```

Inicializamos um diretório exclusivo, geramos a senha e usamos 127.0.0.1:33307. Ao terminar, encerramos o servidor. Mantemos credenciais em `.local/mysql-validation.json`, fora do Git, e preservamos o SQLite da aplicação. Seguimos a [documentação de inicialização](https://dev.mysql.com/doc/refman/8.4/en/data-directory-initialization.html).

## Workbench e dados existentes

Importamos `database/migrations/001-schema.mysql.sql` em File → Import → Reverse Engineer MySQL Create Script, revisamos o [dicionário](../database/modeling/dicionario-dados.md) e salvamos o modelo `.mwb`.

Para transferir uma instalação SQLite para MySQL, fazemos backup e planejamos a migração. Não transferimos contas ou registros apenas alterando o `.env`.

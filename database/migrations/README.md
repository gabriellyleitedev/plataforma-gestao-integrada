# Schema e migrações

Inicializamos as tabelas com `001-schema.mysql.sql`. No adaptador SQLite, traduzimos a sintaxe dos identificadores automáticos e do bloqueio de configuração inicial. Não inserimos registros de negócio.

Para evoluir o schema, criamos scripts numerados e documentamos ordem, dependências e execução no PR. Não reescrevemos scripts já aplicados. O bootstrap atual carrega apenas o schema inicial; precisamos aplicar futuras alterações explicitamente e definir um runner antes de ampliar esse processo.

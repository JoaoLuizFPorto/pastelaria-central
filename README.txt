Pastelaria Central - v9.0
========================

Ecommerce acadêmico desenvolvido com Node.js, Express, Handlebars e MySQL.
A conexão com o banco utiliza mysql2. Os produtos, contas, carrinhos,
favoritos e pedidos são armazenados no MySQL.

1. Instalação e execução
-----------------------

Requisitos: Node.js 22.22 ou superior, npm e MySQL em execução.

Abra a pasta "Pastelaria Central - v9.0" no terminal e instale as dependências:

    npm install

Não é necessário importar o banco manualmente pelo Workbench. Na primeira
execução, o servidor cria o banco e as tabelas e carrega os produtos do
arquivo database/pastelaria-central.sql. O usuário do MySQL configurado
no .env precisa ter permissão para criar o banco e suas tabelas.

A importação inicial é registrada no banco. Reiniciar o servidor não
substitui produtos, contas ou pedidos e não restaura produtos apagados.

Confira DB_USER e DB_PASSWORD no .env conforme o MySQL do computador.
DB_NAME já está configurado como pastelaria_central_entrega.

O SQL inclui 47 produtos oficiais, dois exemplos inativos e dois excluídos.
As tabelas de contas, pedidos, histórico, carrinhos, favoritos, sessões e
notificações estão vazias. Produtos avulsos de testes anteriores não estão
incluídos. Crie uma conta pela interface ou utilize npm run create-admin
para cadastrar o administrador.

Mantenha database/schema.sql e database/pastelaria-central.sql no projeto:
o servidor utiliza esses arquivos na preparação inicial. O SQL completo
também pode ser importado manualmente em uma instalação nova. Nesse caso,
execute-o inteiro no Workbench antes de usar o site; ele substitui as
tabelas do banco pastelaria_central_entrega.

Para iniciar normalmente:

    npm start

Para desenvolver com reinício automático pelo Nodemon:

    npm run dev

O comando nodemon app.js também pode ser usado quando o Nodemon estiver
instalado globalmente. O script dev utiliza a instalação local do projeto.
Para instalar globalmente, use npm install -g nodemon (opcional).

Acesse http://localhost:3000 e mantenha o terminal aberto enquanto utiliza
o site. Ctrl+C encerra o servidor. Não inicie duas instâncias na porta 3000.

No Windows, caso o PowerShell bloqueie os scripts do npm, use o Prompt de
Comando ou substitua npm por npm.cmd.

2. Configuração do .env
----------------------

O arquivo .env fica na mesma pasta de app.js. Ele é lido pelo servidor e
pelos scripts administrativos. Mantenha uma variável por linha, no formato
NOME=valor. Linhas iniciadas com # são comentários.

Conexão com o banco:

    DB_HOST      Endereço do servidor MySQL; normalmente 127.0.0.1.
    DB_PORT      Porta do MySQL; normalmente 3306.
    DB_USER      Usuário com acesso ao banco.
    DB_PASSWORD  Senha desse usuário.
    DB_NAME      Nome do banco utilizado pelo projeto.

As credenciais precisam corresponder ao MySQL instalado no computador.
O MySQL Workbench é uma ferramenta para administrar e importar o banco;
o serviço MySQL precisa estar em execução para o site funcionar.

Notificações por email:

    SMTP_HOST      Endereço do servidor SMTP.
    SMTP_PORT      Porta da conexão SMTP.
    SMTP_USER      Conta utilizada para autenticação e envio.
    SMTP_PASSWORD  Senha de autenticação SMTP; no Gmail, senha de app.
    MAIL_FROM      Nome e email apresentados como remetente.

Exemplo de formato do remetente:

    MAIL_FROM="Pastelaria Central <conta@dominio.com>"

Os avisos são enviados ao email cadastrado pelo cliente quando o pedido é
registrado, entregue ou cancelado. A observação é incluída quando informada
na entrega ou no cancelamento. O envio depende da conexão com o serviço SMTP.

Após alterar a conexão com o banco, reinicie o servidor.

3. Scripts administrativos
--------------------------

Execute os comandos abaixo dentro da pasta do projeto, em um terminal
interativo. Eles utilizam a mesma conexão definida no .env.

Criar administrador - scripts/create-admin.js

    npm run create-admin

Solicita nome, sobrenome, email, telefone com DDD, senha e confirmação.
O sobrenome é opcional. A senha precisa ter pelo menos oito caracteres e
não é exibida durante a digitação. O email deve ser exclusivo.
Depois do cadastro, a conta pode entrar pela página de login do site.

Redefinir senha - scripts/reset-password.js

    npm run reset-password

Solicita o email de uma conta existente, a nova senha e a confirmação.
Atualiza a senha do site e encerra as sessões anteriores dessa conta.
Não altera pedidos, perfil, senha do MySQL ou senha do email.


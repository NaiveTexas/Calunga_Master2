# Publicação para testes

O frontend e a API são servidos pelo mesmo processo Node, na raiz de um endereço HTTPS. Nenhuma hospedagem foi criada automaticamente.

## Preparar o servidor

Use Node 24 LTS. Na raiz do projeto:

```sh
npm ci --include=dev
npm --prefix backend ci
npm run build
```

Comando de inicialização: `npm start`. Configure as variáveis no painel da hospedagem:

- `NODE_ENV=production`
- `PORT`: a porta fornecida pela hospedagem.
- `REDEMET_API_KEY`, `AISWEB_API_KEY`, `AISWEB_API_PASS`: suas credenciais.
- `TEST_ACCESS_USER`: nome de acesso dos testadores.
- `TEST_ACCESS_PASSWORD`: senha forte para o grupo de testes.

Use HTTPS fornecido pela hospedagem: a tela de autenticação usa HTTP Basic. Em produção o aplicativo recusa acesso quando não existe senha configurada. O endpoint público `/healthz` serve apenas para verificação do servidor. Todas as outras rotas exigem acesso. Existe um limite global de 600 chamadas à API por minuto, por processo, além dos caches dos serviços.

## Testar localmente

```sh
npm run build
npm start
```

Abra `http://localhost:3000`. Para desenvolvimento, mantenha o backend em execução e use `npm run dev` em outro terminal; abra o endereço do Vite. O Live Server antigo não encaminha as novas URLs relativas da API.

## GitHub

Crie um repositório privado e envie o código após revisar os arquivos. `.env`, `node_modules` e `dist` estão ignorados. Nunca envie credenciais nem arquivos exportados de missões contendo dados pessoais. As variáveis de produção devem ficar no painel do servidor, nunca no frontend.

## Testadores

Compartilhe o link HTTPS e o acesso com o grupo autorizado. Cada navegador tem seu próprio rascunho. Exporte a missão antes de mudar do endereço local para o publicado: o armazenamento não é transferido automaticamente entre endereços. Importar e exportar arquivos permite compartilhar missões.

Antes de compartilhar: conferir entrada com senha, mapa, imagens de aeronaves, METAR/TAF, NOTAMs e salvar/recuperar pelo celular. GRAMET continua em standby.

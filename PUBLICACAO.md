# Publicação para testes

## Publicar e instalar o Calunga

A instalação como PWA está configurada com nome, ícones e janela própria. Não há cache offline nem sincronização de missões entre aparelhos. A aplicação continua exigindo internet e o acesso de testes. O navegador pode pedir novamente o usuário e a senha ao abrir o aplicativo instalado.

1. Na pasta Calunga, confira `git status`. Não inclua `.env` nem arquivos pessoais. Adicione os arquivos da alteração, faça o commit e envie para a branch usada pelo Render.
2. No serviço Web do Render, mantenha a raiz na pasta do projeto (não em `backend`). Use Build Command: `npm ci --include=dev && npm --prefix backend ci && npm run build`. Start Command: `npm start`. Health Check Path: `/healthz`.
3. Mantenha as variáveis descritas abaixo no painel Environment. A instalação não exige novas chaves. Publique o último commit e aguarde o deploy concluir.
4. Abra o endereço HTTPS do Render no navegador do celular e entre com o acesso de testes.
5. Android/Chrome: toque em **Instalar Calunga**, quando oferecido, ou procure **Instalar aplicativo / Adicionar à tela inicial** no menu do navegador. iPhone/Safari: **Compartilhar → Adicionar à Tela de Início**; habilite abrir como aplicativo se a opção aparecer. Os nomes podem variar conforme o sistema.
6. Abra o ícone instalado e confira mapa, consultas, missão salva e download de PDF. Antes de mudar de navegador ou endereço, exporte sua missão; importe-a no app instalado caso ela não apareça.

O botão de instalação só aparece quando o navegador oferece a instalação. Para testar localmente, rode o build e `npm start`, acessando `http://localhost:3000`. Um endereço HTTP da rede local não equivale ao HTTPS de produção.

Após publicar: `/manifest.webmanifest` e `/pwa/icon-192.png` devem abrir sem erro. Apenas esses metadados visuais são públicos; a interface e as APIs continuam protegidas. Não foi adicionado service worker: os arquivos e as consultas seguem o funcionamento online existente, evitando uma versão offline desatualizada.

Referência: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable

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

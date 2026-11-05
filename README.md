# Conversa — chat por link

Aplicação web de chat em tempo real com mensagens de texto, fotos e gravação de áudio. Usa Supabase (banco, Realtime e Storage) e pode ser hospedada em Netlify, Vercel ou GitHub Pages.

## Configuração do backend

1. Crie um projeto em https://supabase.com.
2. Abra **SQL Editor**, cole o conteúdo de `schema.sql` e execute.
3. Em **Project Settings > API**, copie a **Project URL** e a chave **anon/public**.
4. Abra `app.js` e substitua:
   - `COLE_AQUI_SUA_SUPABASE_URL`
   - `COLE_AQUI_SUA_ANON_PUBLIC_KEY`
5. Salve o arquivo.

A chave `anon/public` foi feita para uso no navegador. Nunca coloque a `service_role` key no site.

## Publicar na web

1. Crie uma conta em https://www.netlify.com/ ou https://vercel.com/.
2. Envie os arquivos deste projeto para um repositório GitHub.
3. Na plataforma escolhida, importe o repositório e publique como site estático (sem comando de build; diretório de publicação `.`).
4. Abra o endereço publicado. Clique em **Criar uma nova sala**.
5. Copie o link pelo ícone ↗ e envie às pessoas. Quem abrir o mesmo link entra na mesma sala.

## Como funciona

- O link inclui um identificador de sala na query `?sala=...`.
- O Supabase Realtime distribui novas mensagens para os participantes.
- Fotos e áudios ficam no Storage e são exibidos no histórico.
- Áudio usa a API de gravação do navegador. Em produção, o site deve estar em HTTPS (Netlify/Vercel fornecem HTTPS).

## Limites e privacidade importantes

Esta é uma sala aberta por link, não um mensageiro privado. Qualquer pessoa que receba ou encaminhe o link poderá entrar. A configuração SQL de demonstração permite acesso anônimo ao banco e ao bucket público; não use para informações pessoais, senhas ou conversas sensíveis. Para um produto privado, é necessário adicionar autenticação, regras de acesso por sala, controles contra abuso e política de retenção/exclusão.

O envio de mídia tem limite de 15 MB por arquivo. O nome é apenas identificação visual, não prova a identidade de ninguém.

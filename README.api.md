# Documentação da API

Este arquivo explica como funcionam os endpoints da API, localizados em `pages/api/`.

## O que é a API?

A API é o "cérebro" do sistema. Ela recebe os pedidos do site (frontend), conversa com o banco de dados e devolve as informações.

## Endpoints principais

- **`comments.js`**: Recebe novos comentários (POST) e lista todos os comentários (GET).
- **`comments.json.js`**: Fornece os comentários em formato JSON para o frontend.
- **`comments.svg.js`**: Gera uma imagem SVG com os comentários mais recentes, para ser usada em outros sites.
- **`comments/[id]/like.js`**: Permite que dentro do supabase, você possa dar um coraçãozinho no comentário.
- **`comments/[id]/pin.js`**: Permite que dentro do supabase, você possa fixar um ou vários comentários.

## Como funciona?

1. O frontend faz pedidos para a API (por exemplo, para enviar ou buscar comentários).
2. A API recebe o pedido, processa e conversa com o banco de dados (Supabase).
3. A API devolve a resposta para o frontend ou gera a imagem SVG.

## Personalização

- Para mudar como os dados são processados ou exibidos, edite os arquivos dentro de `pages/api/`.
- Para mudar o visual do SVG, edite `comments.svg.js`.

---

**Resumo:**
A API conecta o site ao banco de dados e gera a imagem SVG dos comentários. Ela é responsável por toda a lógica do sistema.

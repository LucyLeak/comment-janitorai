# Documentação da Geração de SVG

Este arquivo explica como funciona a geração da imagem SVG dos comentários, feita pelo arquivo `pages/api/comments.svg.js`.

## O que é SVG?

SVG é um tipo de imagem vetorizada que pode mostrar textos e desenhos de forma dinâmica sem perder a qualidade. Neste projeto, usamos SVG para mostrar os comentários mais recentes como uma imagem que pode ser colocada no Janitor, assim como catbox, imgur, etc.

## Como funciona?

- O arquivo `comments.svg.js` busca os comentários mais recentes no [banco de dados](README.db.md).
- Ele monta um código SVG, colocando os textos dos comentários, ícones e estilos.
- O resultado é uma imagem que se atualiza automaticamente sempre que alguém comenta.

## Como usar?

- Basta acessar o link `/api/comments.svg` do seu site (exemplo: `https://seu-projeto.vercel.app/api/comments.svg`).
- Você pode copiar esse link e usar como imagem no Janitor.

## Personalização

- Para mudar o visual da imagem (cores, fontes, layout), edite o arquivo `pages/api/comments.svg.js`.
- Você pode adicionar ícones, mudar o tamanho ou o estilo dos comentários.

---

**Resumo:**
A geração de SVG transforma os comentários em uma imagem dinâmica, fácil de compartilhar e usar no Janitor.

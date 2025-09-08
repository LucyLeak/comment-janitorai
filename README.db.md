# Documentação do Banco de Dados

Este arquivo explica como funciona o banco de dados e o arquivo `lib/db.js`.

## O que é o banco de dados?

O banco de dados é onde todos os comentários ficam guardados. Usamos o Supabase, que é gratuito e fácil de usar.

## Estrutura da tabela

A tabela principal se chama `comments` e tem os seguintes campos:
- `id`: Identificador único do comentário.
- `created_at`: Data e hora em que o comentário foi criado.
- `name`: Nome de quem comentou.
- `message`: Mensagem do comentário.
- `liked_by_owner`: Se o comentário foi curtido pelo dono do site.
- `pinned`: Se o comentário foi fixado.

## O que faz o arquivo `lib/db.js`?

- Centraliza todas as funções que conversam com o Supabase.
- Permite buscar, salvar, curtir e fixar comentários.
- Facilita a manutenção e organização do código.

## Personalização

- Para mudar como os dados são salvos ou buscados, edite o arquivo `lib/db.js`.
- Para adicionar novos campos, altere a tabela no Supabase e adapte o código.

---

**Resumo:**
O banco de dados guarda todos os comentários e o arquivo `lib/db.js` faz a ponte entre o site e o Supabase.

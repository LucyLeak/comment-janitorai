# Documentação do Frontend

Este arquivo explica como funciona a parte visual do sistema de comentários, localizada em `pages/index.js`.

## O que é o Frontend?

O frontend é a página que os usuários acessam para ver e enviar comentários. A minha tem um visual de terminal antiga, mas você pode modificar como quiser.

## Principais funções

- **Exibir comentários:** Mostra todos os comentários que estão salvos no [banco de dados](README.db.md).
- **Formulário de envio:** Permite que qualquer pessoa coloque um nome e mensagem para comentar.
- **Atualização automática:** Quando um novo comentário é enviado, ele aparece na lista sem precisar atualizar a página.

## Como funciona?

1. Ao abrir a página, ela busca os comentários no [banco de dados](README.db.md) (Supabase) usando a [API](README.api.md).
2. Os comentários são mostrados em ordem.
3. QUALQUER usuário pode preencher o formulário e enviar um novo comentário.
4. O comentário é enviado para a [API](README.api.md), que salva no [banco de dados](README.db.md).
5. A página atualiza e mostra o novo comentário.

## Personalização

- Para mudar o visual, edite os estilos dentro do arquivo `pages/index.js`.
- Você pode alterar cores, fontes e o layout para deixar do seu jeito.

---

**Resumo:**
O frontend é a parte que o usuário vê e interage. Ele conecta o usuário ao [banco de dados](README.db.md) e à [API](README.api.md), tornando possível comentar e ver comentários em tempo real.

# Sistema de Comentários com Imagem SVG Dinâmica

Este é um projeto Next.js que implementa um sistema de comentários com uma interface de terminal retro. A principal característica é a geração de uma imagem SVG dinâmica com os comentários mais recentes, ideal para ser incorporada em perfis do GitHub ou outros sites.

![Exemplo de SVG](https://raw.githubusercontent.com/lucyleak/comment-janitorai/main/public/example.png)

## Funcionalidades

-   **Interface de Terminal:** Uma página de comentários com visual retrô que imita um terminal de computador.
-   **Envio de Comentários:** Formulário para os usuários deixarem nome e mensagem.
-   **SVG Dinâmico:** Um endpoint de API (`/api/comments.svg`) que gera uma imagem SVG com os comentários mais recentes.
-   **Moderação Simples:** Endpoints para "curtir" (`/api/comments/[id]/like`) e "fixar" (`/api/comments/[id]/pin`) comentários.
-   **Backend com Supabase:** Utiliza o Supabase para armazenamento de dados, facilitando a configuração.

## Como Funciona

O projeto é dividido em três partes principais:

1.  **Frontend (`pages/index.js`):** Uma página React que busca e exibe os comentários do banco de dados. Ela também contém o formulário para que os usuários possam postar novos comentários.
2.  **API do Next.js (`pages/api/`):**
    -   `comments.js`: Lida com a criação (`POST`) e listagem (`GET`) de comentários.
    -   `comments.json.js`: Fornece os comentários em formato JSON para o frontend.
    -   `comments.svg.js`: O coração do projeto. Este endpoint busca os comentários mais recentes no Supabase, formata o texto, adiciona ícones e renderiza tudo em uma imagem SVG.
    -   `comments/[id]/like.js` e `comments/[id]/pin.js`: Endpoints para moderar comentários específicos.
3.  **Banco de Dados (`lib/db.js`):** Uma camada de abstração que centraliza todas as interações com o Supabase, como buscar, salvar, curtir e fixar comentários.

## Tutorial: Como Configurar e Usar

Siga os passos abaixo para ter sua própria versão deste projeto no ar.

### 1. Pré-requisitos

-   [Node.js](https://nodejs.org/en/) (versão 18 ou superior)
-   Uma conta no [GitHub](https://github.com/)
-   Uma conta no [Supabase](https://supabase.com/) (é gratuito)

### 2. Clone o Repositório

Comece clonando este repositório para a sua máquina local.

```bash
git clone https://github.com/lucyleak/comment-janitorai.git
cd comment-janitorai
```

### 3. Instale as Dependências

Use o `npm` (ou seu gerenciador de pacotes preferido) para instalar as dependências do projeto.

```bash
npm install
```

### 4. Configure o Supabase

O Supabase será nosso banco de dados.

1.  Vá para [supabase.com](https://supabase.com) e crie um novo projeto.
2.  Após a criação, vá para **SQL Editor** no menu lateral.
3.  Clique em **New query** e cole o seguinte script para criar a tabela `comments`.

    ```sql
    CREATE TABLE comments (
      id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
      name TEXT,
      message TEXT,
      liked_by_owner BOOLEAN DEFAULT false,
      pinned BOOLEAN DEFAULT false
    );
    ```

4.  Execute o script.
5.  Agora, vá para **Project Settings** (ícone de engrenagem) > **API**. Guarde as seguintes informações:
    -   **Project URL** (URL do Projeto)
    -   **`service_role` Secret** (Chave secreta `service_role`)

### 5. Configure as Variáveis de Ambiente

Crie um arquivo chamado `.env.local` na raiz do seu projeto e adicione as chaves que você copiou do Supabase.

```
# .env.local
NEXT_PUBLIC_SUPABASE_URL=SUA_PROJECT_URL_AQUI
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE_AQUI
```

Substitua `SUA_PROJECT_URL_AQUI` e `SUA_CHAVE_SERVICE_ROLE_AQUI` pelos valores do seu projeto Supabase.

### 6. Execute o Projeto Localmente

Agora você pode iniciar o servidor de desenvolvimento.

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a página de comentários funcionando.

### 7. Faça o Deploy na Vercel

Para que a imagem SVG seja acessível publicamente, o ideal é fazer o deploy do projeto. A Vercel é a opção mais fácil.

1.  Envie seu projeto clonado para um novo repositório no seu GitHub.
2.  Vá para [vercel.com](https://vercel.com) e crie uma conta.
3.  Crie um **New Project** e importe o repositório do GitHub.
4.  Durante a configuração, vá para a seção **Environment Variables** e adicione as mesmas variáveis `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` que você usou no arquivo `.env.local`.
5.  Clique em **Deploy**.

Após o deploy, a Vercel fornecerá uma URL pública para o seu projeto (ex: `https://seu-projeto.vercel.app`).

### 8. Use sua Imagem SVG

Sua imagem SVG estará disponível na URL: `https://seu-projeto.vercel.app/api/comments.svg`.

Você pode incorporá-la em qualquer arquivo Markdown, como o `README.md` do seu perfil do GitHub, da seguinte forma:

```markdown
![Meus Comentários Recentes](https://seu-projeto.vercel.app/api/comments.svg)
```

## Customização

-   **Estilo da Página:** Para alterar o visual da página de comentários, edite os estilos `jsx` dentro do arquivo [`pages/index.js`](pages/index.js).
-   **Estilo do SVG:** Para alterar o visual da imagem SVG (cores, fontes, layout), modifique o código no arquivo [`pages/api/comments.svg.js`](pages/api/comments.svg.js)
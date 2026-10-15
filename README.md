# Comentários, Status e Imagens SVG para o perfil no Janitor AI

> **Toda a documentação do projeto**
>
> | Arquivo | Sobre o quê |
> |---|---|
> | [README.md](README.md) | Este arquivo: o que é o site e como instalar, passo a passo |
> | [README.db.md](README.db.md) | O banco de dados (Supabase) e o arquivo `lib/db.js` |
> | [README.api.md](README.api.md) | A API do site, na pasta `pages/api/` |
> | [README.frontend.md](README.frontend.md) | A página de comentários |
> | [README.svg.md](README.svg.md) | Como a imagem SVG é gerada |
>
> Ir direto para: [Passo a passo](#passo-a-passo) · [No dia a dia](#no-dia-a-dia) · [Problemas comuns](#problemas-comuns)

Um site simples inspirado no [status.cafe](https://status.cafe) onde as pessoas deixam **comentários** (com nome, foto e reações de emotes) e onde você publica um status só seu.

O site também gera imagens que se atualizam sozinhas (infelizmente por limitação do janitor AI, é preciso atualizar a página) com os últimos comentários e com o seu status. Você coloca essas imagens no seu perfil do Janitor AI (ou em qualquer lugar que aceite imagem) e elas mostram sempre a versão mais nova.

![Exemplo de SVG](https://files.catbox.moe/mnuf79.png)

## O que ele faz

- **Comentários anônimos** Qualquer pessoa comenta e responde, sem criar conta.
- **Reações com emotes** Cada pessoa pode colocar até 5 emotes diferentes em cada comentário. Clicar de novo no emote tira a reação. É tudo anônimo: ninguém vê quem reagiu.
- **Informações salvas por um id gerado aleatóriamente baseado no seu navegador** O nome e a foto de perfil ficam salvos no navegador da pessoa, então ela não precisa preencher tudo de novo. O botão "Forget my info" apaga esses dados.
- **Página de status só sua.** Todo mundo vê, mas só você publica (com senha). Só você também pode reagir aos status.
- **Curtir e fixar comentários. (Deprecated)** Você fixa um comentário (ele vai para o topo) ou dá um coraçãozinho nele, direto pelo Supabase.

## Como funciona, em 3 linhas

1. O site é feito com [Next.js](https://nextjs.org) e fica hospedado na [Vercel](https://vercel.com).
2. Os comentários, os status e as reações ficam guardados no [Supabase](https://supabase.com), um banco de dados gratuito.
3. Visitantes não têm login. Só você tem uma senha, para a página de status.

## O que você precisa

- [Node.js](https://nodejs.org/en/) versão 22 ou acima
- Um repositório no [GitHub](https://github.com/), uma conta no [Supabase](https://supabase.com/) e uma na [Vercel](https://vercel.com/). O site é leve suficiente para rodar bem no plano gratuito
- Um editor de código, como o [VS Code](https://code.visualstudio.com/) (no celular, use o Termux)

## Passo a passo

### 1. Baixe o projeto

```bash
git clone https://github.com/LucyLeak/comment-janitorai.git
cd comment-janitorai
npm install
```

### 2. Crie o banco de dados (Supabase)

1. Crie um projeto novo no [supabase.com](https://supabase.com).
2. No menu lateral, abra SQL Editor e clique em New query.
3. Cole o script abaixo e clique em Run. Ele cria as três tabelas principais do site: `comments`, `status` e `reactions`.

```sql
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  message text not null,
  avatar_url text,
  parent_id uuid references public.comments(id) on delete cascade, -- preenchido só nas respostas
  liked_by_owner boolean not null default false,
  pinned boolean not null default false
);

create table if not exists public.status (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  message text not null,
  avatar_url text
);

create table if not exists public.reactions (
  id bigint generated always as identity primary key,
  target_type text not null check (target_type in ('comment', 'status')),
  target_id text not null,   -- o id do comentário ou do status
  emoji text not null,       -- o nome do emote
  voter_hash text not null,  -- código embaralhado do navegador (nunca é mostrado)
  created_at timestamptz not null default now(),
  unique (target_type, target_id, emoji, voter_hash)
);

create index if not exists reactions_target_idx on public.reactions (target_type, target_id);
create index if not exists reactions_created_idx on public.reactions (created_at);

alter table public.comments enable row level security;
alter table public.status enable row level security;
alter table public.reactions enable row level security;
```

4. Pegue as duas informações que o site precisa. Vá em Project Settings e abra API. Salve o Project URL e a chave service_role.

> Cuidado: a chave `service_role` dá acesso total ao seu banco de dados. Nunca poste essa chave, nunca deixe essa chave pública.

### 3. Crie o arquivo de configurações

Na pasta do projeto, crie um arquivo chamado `.env.local` com este conteúdo:

```
NEXT_PUBLIC_SUPABASE_URL=cole-aqui-o-project-url
SUPABASE_SERVICE_ROLE_KEY=cole-aqui-a-chave-service-role
STATUS_PASSWORD=a-senha-que-voce-vai-usar-para-entrar-no-status
STATUS_AUTH_TOKEN=um-texto-longo-e-aleatorio
REACTION_SALT=outro-texto-longo-e-aleatorio
```

| Configuração | Para que serve |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | O endereço do seu Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | A chave secreta do seu Supabase. |
| `STATUS_PASSWORD` | A senha que você digita para entrar na página de status. |
| `STATUS_AUTH_TOKEN` | Um código secreto que prova que você já entrou. Ninguém precisa decorar, então use um texto longo e aleatório. |
| `REACTION_SALT` | Opcional. Embaralha ainda mais os códigos das reações anônimas. Escolha um valor e **não troque depois**, senão as reações antigas deixam de poder ser desfeitas. |

Para gerar um texto longo e aleatório, rode isto no terminal e copie o resultado:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O arquivo `.env.local` já é ignorado pelo Git, ele não vai para o GitHub sozinho. Mesmo assim, verifique antes de enviar seu projeto.

### 4. Rode no seu computador

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para ver a página do site. Teste se funciona tudo. A página de status fica em [http://localhost:3000/status](http://localhost:3000/status).

### 5. Coloque o site no ar usando o vercel

1. Faça upload do projeto em um repositório seu no GitHub.
2. No [Vercel](https://vercel.com), clique em New Project e escolha esse repositório que você armazenou o projeto.
3. Antes de clicar em Deploy, abra Environment Variables e adicione as mesmas configurações do passo 3, uma por uma.
4. Quando fizer toda etapa, só clicar em Deploy.

O Vercel vai te dar um endereço público, tipo `https://[nome-do-seu-projeto].vercel.app`.

> Se você mudar uma configuração no Vercel depois, não esqueça de fazer um **Redeploy**. Sem isso, o site continua usando o deploy antigo.

### 6. Use as imagens SVG

| Endereço | O que mostra | Tamanho |
|---|---|---|
| `/api/comments.svg` | Os 6 comentários mais recentes (os fixados aparecem primeiro) | 228 px de largura |
| `/api/comments.mobile.svg` | O mesmo, numa versão mais larga para celular | 301 px de largura |
| `/api/status/svg` | O seu status mais recente | 392 × 76 px |

Agora a gente vai converter os comentários em um bloco de imagem svg para colocar no JanitorAI.
Para fazer isso é muito fácil, lembra da URL do seu site? colocando `https://[nome-do-seu-projeto].vercel.app/api/comments.svg` todos os comentários automáticamente se transformam em uma imagem svg, permitindo que você veja os comentários serem atualizados cada vez que você atualiza sua página.

Para colocar esse link no janitorAI, você vai abrir o editor de css e colocar esse código aqui:
```HTML
<a class="comments" href="https://[nome-do-seu-projeto].vercel.app/">
    <img src="https://[nome-do-seu-projeto].vercel.app/api/comments.svg" alt="comments">
</a>
```

As imagens mudam sozinhas quando alguém comenta. Alguns sites guardam a imagem por um tempinho, então a mudança pode demorar um pouco para aparecer.

## No dia a dia

**Entrar na página de status.** Abra `/status/login`, digite a senha (`STATUS_PASSWORD`) e depois vá para `/status`. O login dura 30 dias nesse navegador.

(Deprecated) ~~**Curtir ou fixar um comentário.** No Supabase, abra **Table Editor**, escolha a tabela `comments`, ache o comentário e marque `liked_by_owner` (coraçãozinho) ou `pinned` (fixado, vai para o topo) como `true`.~~

**Apagar um comentário.** No supabase, apague a linha dele. Se você criou as tabelas com o script acima, as respostas desse comentário somem junto.

**Adicionar emotes.** Coloque a imagem do emote na pasta `public/emojis`. O nome do arquivo vira o nome do emote, então use só letras, números e os símbolos `_`, `+` e `-`. Formatos aceitos: png, gif, jpg, jpeg e webp. Depois envie para o GitHub e o Vercel atualiza o site. (Cuidado com a quantidade de emotes que você coloca, dependendo, pode causar travamentos em celulares fracos)

## Limites e proteções

- **Tamanhos:** nome com até 30 caracteres, comentário com até 100 e status com até 140. A página mostra os 50 itens mais recentes.
- **Foto de perfil:** são reduzidas para 128 × 128 antes de enviar, e só são aceitas imagens png, jpeg ou webp (SEM GIFS AINDA!!!!).
- **Reações:** até 5 por pessoa em cada comentário, e até 20 emotes diferentes em cada comentário.
- **Spam:** tem um limite de requisições (pedidos) por minuto. Quem erra a senha do status 5 vezes fica bloqueado por 10 minutos.
- **Privacidade das reações:** o navegador cria um código aleatório e só uma versão embaralhada dele é guardada. Nenhum IP é usado nas reações. Os limites de velocidade dos comentários e do status olham o IP só na memória do servidor, por pouco tempo, e ele não é guardado no banco de dados.
- **Cuidado:** quem limpa os dados do navegador ganha um código novo e consegue reagir de novo. Sem login, não dá para evitar isso por completo.

## Mudando o visual

| Quero mudar... | Arquivo |
|---|---|
| O visual e os textos da página de comentários (cores, regras, título) | `pages/index.js` |
| O visual e os textos da página de status (inclusive o "about me") | `pages/status/index.js` |
| A imagem SVG dos comentários | `pages/api/comments.svg.js` |
| A imagem SVG do status | `pages/api/status/svg.js` |
| Os emotes | pasta `public/emojis` |
| A aparência das reações e o texto do botão "+" | `components/Reactions.js` |
| Os limites (tamanho do texto, número de reações) | `pages/api/comments.js`, `pages/api/status/index.js` e `pages/api/reactions.js` |

## Onde fica cada coisa

```
pages/index.js       a página de comentários
pages/status/        a página de status e a página de login
pages/api/           o "bastidor" do site: recebe os pedidos e conversa com o Supabase
components/          a barra de reações (emotes)
lib/                 ajudantes: ligação com o Supabase, login e código do navegador
public/emojis/       os emotes
```

## Problemas comuns

- **O Vercel diz `Module not found: Can't resolve '../lib/visitor'`.** A pasta `components` precisa ficar na raiz do projeto, ao lado de `pages` e `lib`, e não dentro de `pages`.
- **O login do status diz `Status auth not configured`.** Faltam `STATUS_PASSWORD` ou `STATUS_AUTH_TOKEN` nas configurações. Adicione e faça um Redeploy.
- **As reações dão erro ou não aparecem.** Provavelmente a tabela `reactions` não foi criada. Rode o script do passo 2.
- **Mudei uma configuração e nada mudou.** No Vercel, faça um Redeploy. No computador, pare o `npm run dev` e rode de novo.
- **Aparece "Too many requests".** Foram muitos pedidos em um minuto. Espere um pouco e tente de novo.

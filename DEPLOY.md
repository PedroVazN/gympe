# Deploy do GymPE na Vercel

O GymPE é um monorepo com duas aplicações:

- `client/` → Frontend React + Vite
- `server/` → Backend Node + Express + MongoDB

Na Vercel, o caminho mais limpo é criar **dois projetos** apontando para essas subpastas. Abaixo está o passo a passo.

---

## Pré-requisitos

1. **Código no GitHub** (GitLab ou Bitbucket também funcionam).
2. **MongoDB Atlas** com cluster criado e um usuário com permissão de leitura/escrita.
3. Em *Network Access* do Atlas, adicione `0.0.0.0/0` (ou a lista de IPs da Vercel) para permitir conexão.
4. Conta em [vercel.com](https://vercel.com) conectada ao seu Git.

---

## Passo 1 — Subir o código para o GitHub

```bash
git init
git add .
git commit -m "GymPE pronto para deploy"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/GymPe.git
git push -u origin main
```

---

## Passo 2 — Deploy do Backend (`server/`)

1. Em [vercel.com/new](https://vercel.com/new) escolha o repositório do GymPE.
2. Em **Root Directory**, clique em *Edit* e selecione `server`.
3. Em **Framework Preset**, deixe como *Other*.
4. Em **Build Command**, deixe em branco (ou `npm install`).
5. Em **Output Directory**, deixe em branco.
6. Em **Environment Variables**, adicione:
   - `MONGO_URI` → sua URI do Atlas (`mongodb+srv://...`)
   - `JWT_SECRET` → um segredo forte
7. Clique em **Deploy**.

Depois do deploy, anote a URL pública do backend. Algo como:

```
https://gympe-api-xxxxx.vercel.app
```

Teste batendo em `https://SEU_BACKEND.vercel.app/api/health` — deve responder `{ "status": "ok", "app": "GymPE API" }`.

### Como o backend virou serverless

- `server/api/index.js` é o handler que a Vercel executa.
- `server/vercel.json` redireciona qualquer caminho (`/*`) para esse handler, então todas as rotas Express continuam funcionando.
- `server/src/config/db.js` usa cache global da conexão Mongo (obrigatório em serverless, senão cada request abre uma conexão nova).
- `server/src/server.js` só sobe o `app.listen()` quando **não** estiver na Vercel.

---

## Passo 3 — Deploy do Frontend (`client/`)

1. Em [vercel.com/new](https://vercel.com/new) selecione novamente o mesmo repositório.
2. Em **Root Directory**, selecione `client`.
3. **Framework Preset** será detectado automaticamente como *Vite*.
4. **Build Command** = `npm run build`, **Output Directory** = `dist` (padrão do Vite).
5. Em **Environment Variables**, adicione:
   - `VITE_API_URL` → `https://SEU_BACKEND.vercel.app/api` (a URL do passo anterior **com `/api` no final**).
6. Clique em **Deploy**.

Depois do deploy, acesse a URL pública, crie uma conta e confirme que tudo está funcionando.

---

## Variáveis de ambiente resumidas

### Projeto `server`

| Nome | Valor |
| --- | --- |
| `MONGO_URI` | `mongodb+srv://usuario:senha@cluster.mongodb.net/gympe?retryWrites=true&w=majority` |
| `JWT_SECRET` | `uma_string_grande_e_aleatoria` |

### Projeto `client`

| Nome | Valor |
| --- | --- |
| `VITE_API_URL` | `https://SEU_BACKEND.vercel.app/api` |

---

## Passo 4 — Promover para domínio próprio (opcional)

Na Vercel, em cada projeto:

1. Vá em **Settings → Domains**.
2. Adicione, por exemplo:
   - `app.seudominio.com.br` → projeto do `client`
   - `api.seudominio.com.br` → projeto do `server`
3. Configure os DNS conforme a Vercel indicar.
4. Volte no projeto `client` e atualize `VITE_API_URL` para `https://api.seudominio.com.br/api`, depois faça **Redeploy**.

---

## Ajustes que pode precisar

### CORS

Se quiser restringir quem pode bater na API, edite `server/src/app.js`:

```js
app.use(cors({ origin: ["https://app.seudominio.com.br"] }));
```

### Cold start

A primeira chamada ao backend em serverless pode demorar 1–2 s (cold start). As seguintes ficam instantâneas graças ao cache do Mongoose.

### Logs

Na Vercel, em cada projeto: **Deployments → escolha o deploy → Functions → Logs**.

---

## Alternativa mais simples (sem serverless)

Se quiser evitar adaptar o Express e rodar o backend como um servidor normal 24/7:

- **Frontend**: Vercel (pasta `client`).
- **Backend**: [Render](https://render.com) ou [Railway](https://railway.app), ambos com plano gratuito e suporte nativo a Node/Express.

Nesse caso, no Render:

1. *New Web Service* → conecte o repositório.
2. **Root Directory**: `server`
3. **Build Command**: `npm install`
4. **Start Command**: `node src/server.js`
5. Adicione `MONGO_URI` e `JWT_SECRET` nas variáveis de ambiente.
6. No projeto `client` da Vercel, aponte `VITE_API_URL` para a URL pública do Render.

Nada no código precisa mudar nesse cenário — o `server/src/server.js` já sobe o Express normalmente quando `process.env.VERCEL` não está setado.

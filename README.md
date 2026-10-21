# GameStock — Front-end no Render (Static Site)

Site em React + Vite (JavaScript, CSS puro). Visual inspirado na loja da Steam.

## Publicar no Render
1. **New → Static Site** → escolha o repositório.
2. Configure:
   - **Root Directory:** `front-end`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
3. Em **Environment**, cadastre `VITE_API_URL` com o endereço do back-end, terminando em `/api`
   (ex.: `https://gamestock-api.onrender.com/api`).
   ⚠️ O Vite coloca essa variável dentro do site **na hora do build**: se mudar o valor, faça um novo deploy.
4. Copie o endereço do Static Site (ex.: `https://gamestock.onrender.com`) e coloque na variável `FRONTEND_URL` do back-end (CORS).

Não é preciso regra de rewrite: as páginas usam `#/` (ex.: `#/jogo/161`).

## Rodar no computador
```bash
npm install
npm run dev      # http://localhost:3000
```
Crie um `.env` (modelo em `.env.example`) apontando para a API.

## Imagens (pasta `public/`)
- `public/capas/{id}.jpg` — capa de cada jogo pelo id (ex.: `161.jpg`). Sem arquivo, aparece `capas/padrao.svg`. Galeria: `{id}-1.jpg`, `{id}-2.jpg`…
- `public/bancos/{slug}.svg` e `public/bandeiras/{slug}.svg` — logos **placeholder**. Para usar os logos reais, substitua o arquivo **mantendo o mesmo nome**.

As capas colocadas aqui são permanentes (fazem parte do site). Imagens enviadas pelo painel admin ficam no back-end e **somem a cada novo deploy** no plano gratuito do Render.

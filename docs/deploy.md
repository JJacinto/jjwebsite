# Deploy do site

**Como publicar:** pede ao Claude "publica" (no PC ou no telemóvel, pela sessão Remote Control do Website). Ele faz commit, põe em `main` e acompanha o deploy até ao fim. Não precisas de SSH nem de aprovar nada na Cloudflare.

**O que acontece:** um push para `main` que mexa em `src/`, `public/`, `design-system/` ou na config de build corre `.github/workflows/deploy.yml`: build do Astro → túnel Cloudflare até ao NAS (`ssh.joaojacinto.com`, com um *service token* do Cloudflare Access) → cópia do `dist/` para `/home/jjacinto8/sites/joaojacinto/public` → purge da cache da Cloudflare. Demora cerca de 2 minutos. Também se pode correr à mão em GitHub → Actions → Deploy to NAS → Run workflow.

Para seguir um deploy: `node scripts/watch-deploy.mjs <commit>`.

## Se o deploy falhar

O passo "Test SSH connection" tenta duas vezes e depois diz qual destes é o caso.

**"Cloudflare Access recusou o token"**: a Cloudflare pediu login no browser porque os secrets do GitHub não batem certo com o token. A política "Github Actions deploy" (Service Auth) da aplicação `ssh.joaojacinto.com` aceita o token `github-actions-joaojacinto-main`.
1. Cloudflare (dash.cloudflare.com) → Zero Trust → Access controls → Service credentials → Service Tokens → `github-actions-joaojacinto-main` → **⋯ → Rotate secret**. Copia o Client Secret (só aparece uma vez) e o Client ID (**⋯ → Edit**).
2. GitHub → `JJacinto/jjwebsite` → Settings → Secrets and variables → Actions → atualiza `CF_ACCESS_CLIENT_SECRET` e `CF_ACCESS_CLIENT_ID`. Sem espaços nem Enter no fim.
3. No run que falhou, **Re-run failed jobs**. Logo a seguir a rodar o secret pode falhar uma vez com `websocket: bad handshake`; um segundo re-run passa.
O token expira a 22 abr 2027: antes disso, **⋯ → Refresh token** (mantém as credenciais, o GitHub não muda).

**"Túnel não chegou ao SSH do NAS"**: o token passou, mas o túnel `nas-home` não ligou ao SSH. Em Networking → Tunnels → `nas-home`: tem de estar Healthy e a rota `ssh.joaojacinto.com` tem de apontar para `ssh://host.docker.internal:22` (o `cloudflared` corre em Docker no NAS). Se estiver, confirma que o SSH do NAS está ligado (`/nas`).

Os outros secrets do workflow: `SSH_PRIVATE_KEY` (chave do utilizador `jjacinto8` no NAS), `CF_API_TOKEN` e `CF_ZONE_ID` (purge da cache).

# Deploy do site

**Como publicar:** pede ao Claude "publica" (no PC ou no telemóvel, pela sessão Remote Control do Website). Ele faz commit, põe em `main` e acompanha o deploy até ao fim. Não precisas de SSH nem de aprovar nada na Cloudflare.

**O que acontece:** um push para `main` que mexa em `src/`, `public/`, `design-system/` ou na config de build corre `.github/workflows/deploy.yml`: build do Astro → túnel Cloudflare até ao NAS (`ssh.joaojacinto.com`, com um *service token* do Cloudflare Access) → cópia do `dist/` para `/home/jjacinto8/sites/joaojacinto/public` → purge da cache da Cloudflare. Demora cerca de 2 minutos. Também se pode correr à mão em GitHub → Actions → Deploy to NAS → Run workflow.

Para seguir um deploy: `node scripts/watch-deploy.mjs <commit>`.

## Se o deploy falhar com "Cloudflare Access recusou o token"

O túnel só deixa entrar o GitHub com o service token. Se o token expirou ou deixou de estar numa política, a Cloudflare pede login no browser e o job falha ao fim de 90 segundos (antes ficava horas à espera). Para corrigir, uma vez, no browser do PC:

1. **Cloudflare Zero Trust** (one.dash.cloudflare.com) → Access → Service credentials → **Service Tokens**.
   - Se o token do deploy aparece expirado: **Refresh**. Mantém o mesmo Client ID e Secret, por isso o GitHub não precisa de mudar e já está. Salta para o passo 3.
   - Se não existe: **Create Service Token**, nome `github-deploy`, duração **Non-expiring**. Copia o Client ID e o Client Secret (o Secret só aparece uma vez).
2. Access → **Applications** → a aplicação de `ssh.joaojacinto.com` → Policies: tem de haver uma política com Action **Service Auth** e Include **Service Token = github-deploy**. Se não houver, cria-a.
3. Só se criaste um token novo: GitHub → `JJacinto/jjwebsite` → Settings → Secrets and variables → Actions → atualiza `CF_ACCESS_CLIENT_ID` e `CF_ACCESS_CLIENT_SECRET`.
4. Na página do run que falhou, **Re-run jobs**.

Os outros secrets do workflow: `SSH_PRIVATE_KEY` (chave do utilizador `jjacinto8` no NAS), `CF_API_TOKEN` e `CF_ZONE_ID` (purge da cache).

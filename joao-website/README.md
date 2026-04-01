# João Jacinto — Personal Website

A single-page portfolio website built with vanilla HTML/CSS/JS. No build step, no dependencies — just static files served by nginx.

## Project Structure

```
├── index.html          ← The entire website (single file)
├── docker-compose.yml  ← Docker config for NAS hosting
├── nginx.conf          ← Nginx config (gzip, caching, security)
├── Makefile            ← Quick commands (make start / make stop)
├── .gitignore
└── README.md
```

## Iteration Guide

Each version is tracked in git. To request changes, use prompts like:

- "Change hero subtitle words to: X, Y, Z"
- "Replace photo placeholder with image at URL"
- "Add case studies page with project cards"
- "Change accent color from purple to #HEXCODE"
- "Make stats numbers animate on scroll"
- "Add dark mode toggle"

---

## 🚀 Deploy to UGREEN DXP2800 NAS

Full step-by-step below.

### Step 1 — Enable Docker on the NAS

1. Open **UGOS** (your NAS admin panel) in a browser
2. Go to **App Center** → search for **Docker** → Install it
3. Once installed, open Docker from the app list

### Step 2 — Transfer files to NAS

**Option A — Git clone (recommended):**
SSH into your NAS and run:
```bash
cd /volume1        # or wherever your storage is
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git joao-website
cd joao-website
```

**Option B — File manager upload:**
1. In UGOS, open **File Manager**
2. Create a folder: `/volume1/joao-website/`
3. Upload all files from this repo into that folder

### Step 3 — Start the website

SSH into your NAS:
```bash
cd /volume1/joao-website
docker compose up -d
```

Or if your NAS Docker app has a GUI:
1. Open **Docker** → **Compose** → **Add**
2. Point it to `/volume1/joao-website/docker-compose.yml`
3. Click **Deploy**

### Step 4 — Access your site

- **Local network:** `http://YOUR_NAS_IP:8080`
- To find your NAS IP: check UGOS dashboard or router admin

### Step 5 — Expose to the internet (optional)

To make it publicly accessible:

**Option A — Port forwarding (simplest):**
1. In your router admin, forward port `80` → NAS IP port `8080`
2. Get your public IP from [whatismyip.com](https://whatismyip.com)
3. Point your domain's A record to that IP

**Option B — Cloudflare Tunnel (more secure, no port forwarding):**
1. Sign up at [cloudflare.com](https://cloudflare.com), add your domain
2. Install `cloudflared` on the NAS:
   ```bash
   docker run -d --name cloudflared \
     cloudflare/cloudflared:latest tunnel --no-autoupdate run \
     --token YOUR_TUNNEL_TOKEN
   ```
3. In Cloudflare dashboard → Zero Trust → Tunnels → Create tunnel
4. Map your domain to `http://joao-website:80`

**Option C — Tailscale (access from your devices only):**
1. Install Tailscale on NAS + your devices
2. Access via Tailscale IP — no port forwarding needed

### Updating the site

After making changes:
```bash
cd /volume1/joao-website
git pull                      # if using git
docker compose restart        # reload nginx
```

---

## 💻 Push to GitHub

### If the repo already exists and you want to replace everything:

```bash
# 1. Clone your existing repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git temp-repo
cd temp-repo

# 2. Delete all existing files (except .git)
git rm -rf .
# or on Mac/Linux:
find . -maxdepth 1 ! -name '.git' ! -name '.' -exec rm -rf {} +

# 3. Copy new files in
cp -r /path/to/downloaded/joao-website/* .
cp /path/to/downloaded/joao-website/.gitignore .

# 4. Commit and push
git add -A
git commit -m "Replace site with new portfolio design"
git push origin main

# 5. Clean up
cd ..
rm -rf temp-repo
```

### If creating a fresh repo:

```bash
cd /path/to/downloaded/joao-website
git init
git add -A
git commit -m "Initial commit — João Jacinto portfolio"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main --force
```

# Deploy to https://leads.libraro.in/

**Static build – no Node.js required on server.** Works on Apache/PHP shared hosting.

## What You Need to Do

### 1. Set the API URL

Create `.env.production` in the frontend folder:

```
NEXT_PUBLIC_API_URL=https://api.leads.libraro.in/api
```

Replace with your actual Laravel API URL (where your backend is hosted).

### 2. Build the Static Export

**Windows (PowerShell):**
```powershell
cd frontend
npm install
npm run build
.\deploy-build.ps1
```

**Linux/Mac:**
```bash
cd frontend
npm install
npm run build
chmod +x deploy-build.sh
./deploy-build.sh
```

This creates a `deploy/` folder with static HTML, CSS, and JS.

### 3. Upload to Your Server

Upload **all contents** of the `deploy/` folder to your web root, for example:

- `public_html/` (if leads.libraro.in is your main domain)
- Or the folder that serves https://leads.libraro.in

Use FTP, SFTP, cPanel File Manager, or your host’s upload method.

### 4. Done

No Node.js, no `npm start`, no PM2. Apache (or any web server) serves the static files.

---

## Checklist

- [ ] Laravel backend is running and reachable (e.g. `https://api.leads.libraro.in` or `https://leads.libraro.in/api`)
- [ ] CORS is configured on Laravel for `https://leads.libraro.in`
- [ ] `.env.production` has the correct `NEXT_PUBLIC_API_URL`

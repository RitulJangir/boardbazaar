# BoardBazaar — Full-Stack Billboard & Hoarding Rental Marketplace

A production-ready full-stack web application for listing, discovering, filtering (OLX-style), and renting outdoor billboards and hoardings across India.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS (CDN-free, bundled cleanly via Vite)
- **Backend**: Node.js, Express, JWT Authentication (`jsonwebtoken` + `bcryptjs`), Image Uploads (`multer`), Security (`helmet`, `cors`, `express-rate-limit`)
- **Database**: **Dual-mode**:
  - Uses **PostgreSQL** automatically when `DATABASE_URL` is set (ideal for Render, Railway, Neon, Supabase, or VPS).
  - Falls back automatically to a **zero-config local JSON database** (`server/data/db.json`) during local development so you can run the entire app immediately without installing a database!

---

## Quick Start (Local Development)

### 1. Install dependencies
```bash
npm run install:all
```

### 2. Configure environment variables (optional for local run)
```bash
cp server/.env.example server/.env
```
*(If you leave `DATABASE_URL` blank, the server runs on `server/data/db.json` with 10 pre-seeded Indian billboards and a demo account.)*

### 3. Run Backend & Frontend in separate terminals
Terminal 1 (Backend on `http://localhost:5000`):
```bash
npm run dev:server
```

Terminal 2 (Frontend on `http://localhost:5173`):
```bash
npm run dev:client
```

### Demo Credentials (Pre-seeded)
- **Email**: `demo@boardbazaar.in`
- **Password**: `Demo@123`

---

## Production Build (Single-Server Test)
```bash
npm run build
npm start
```
Express serves both the REST API (`/api/*`) and the compiled React frontend (`client/dist`) on `http://localhost:5000`.

---

## Deployment Guides

### Option A: 1-Click Deploy on Render (Recommended — Free Tier Supported)
1. Push this folder to a GitHub repository.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Blueprint**.
3. Connect your GitHub repo. Render automatically detects `render.yaml`, provisions a PostgreSQL database (`boardbazaar-db`), builds the React client, and launches the Node server.

### Option B: Deploy on Railway
1. Push to GitHub and create a new project on [Railway](https://railway.app/).
2. Add a **PostgreSQL** service in the same project.
3. Set `DATABASE_URL` (linked to the Postgres plugin), `JWT_SECRET` (random 32+ char string), and `NODE_ENV=production`.
4. Railway detects the `Dockerfile` and deploys automatically.

### Option C: Split Deployment (Vercel Frontend + Render Backend)
- **Backend (Render)**: Deploy `server/` with Root Directory `server`, Build Command `npm install`, Start Command `npm start`. Set `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_URL=https://your-site.vercel.app`.
- **Frontend (Vercel)**: Import repo with Root Directory `client`, Framework `Vite`, and add environment variable `VITE_API_URL=https://your-backend.onrender.com/api`.

### Note on Image Uploads in Production
By default, uploaded billboard photos are saved to `server/uploads/`. On ephemeral cloud hosts (like Render's free tier), local files reset on redeploy. For permanent image hosting in production, attach a Render Persistent Disk mounted at `/opt/render/project/src/server/uploads` or plug in Cloudinary/AWS S3 inside `server/src/routes/billboards.js`.

# Waves Miami Admin Panel — Deployment Guide

## Stack
- React 18 + Vite + TypeScript
- TailwindCSS 3
- TanStack Query (data fetching)
- React Router v6
- Recharts (dashboard charts)
- Zustand (auth state)

---

## Local Development

```bash
cd waves-admin

# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.example .env.local
# Edit VITE_API_URL to point at your backend

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

---

## Production Build & VPS Deployment

### Step 1 — Configure environment

Edit `.env.production`:
```env
VITE_API_URL=https://api.wavesmiami.com   # your backend domain/IP
```

### Step 2 — Build

```bash
npm run build
# Creates: dist/
```

### Step 3 — Upload to VPS

On your VPS (the backend is at `/var/www/waves-miami-backend`).
The admin panel will live at `/var/www/waves-miami-admin`.

```bash
# Create the directory on VPS
ssh root@YOUR_VPS_IP "mkdir -p /var/www/waves-miami-admin"

# Upload the built files
rsync -avz --delete dist/ root@YOUR_VPS_IP:/var/www/waves-miami-admin/dist/
```

### Step 4 — Nginx configuration

```bash
# Upload nginx config
scp nginx.conf root@YOUR_VPS_IP:/etc/nginx/sites-available/waves-admin

# Enable site
ssh root@YOUR_VPS_IP "
  ln -sf /etc/nginx/sites-available/waves-admin /etc/nginx/sites-enabled/waves-admin
  nginx -t && systemctl reload nginx
"
```

Edit `nginx.conf` before uploading:
- Change `server_name` to your domain or VPS IP
- If using HTTPS, add an SSL block or use `certbot --nginx`

### Step 5 — SSL (recommended)

```bash
ssh root@YOUR_VPS_IP
apt install certbot python3-certbot-nginx -y
certbot --nginx -d admin.wavesmiami.com
```

---

## Quick deploy with script

```bash
# Edit deploy.sh first — set VPS_USER and VPS_HOST
chmod +x deploy.sh
./deploy.sh
```

---

## Backend CORS

Make sure your NestJS backend allows the admin domain.
In your backend `.env` or config, add the admin origin:

```
CORS_ORIGINS=https://admin.wavesmiami.com,http://localhost:5173
```

And in `main.ts`:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGINS?.split(','),
  credentials: true,
})
```

---

## Admin Login

The admin panel uses the same OTP phone login as the mobile app.
The account must have `role = 'admin'` in the database:

```sql
UPDATE auth SET role = 'admin' WHERE phone = '+13050000000';
```

---

## Directory Structure

```
waves-admin/
├── src/
│   ├── api/           # Axios client + all API calls
│   ├── components/
│   │   ├── layout/    # Sidebar, Header, Layout wrapper
│   │   ├── ui/        # Badge, Button, Card, Table, Modal, Pagination
│   │   └── common/    # StatCard, EmptyState, Loader, SearchInput
│   ├── pages/
│   │   ├── auth/      # Login (OTP flow)
│   │   ├── dashboard/ # Stats + charts
│   │   ├── users/     # User management + document review
│   │   ├── operators/ # Operator review + document approval
│   │   ├── vessels/   # Pending vessel approvals
│   │   ├── bookings/  # All bookings + refund issuing
│   │   ├── payments/  # Payment records
│   │   ├── ride-requests/ # On-demand rides
│   │   └── settings/  # Platform settings UI
│   ├── store/         # Zustand auth store (persisted)
│   ├── types/         # All TypeScript types matching backend
│   └── utils/         # Formatters, classname helpers
├── nginx.conf          # Ready-to-use nginx server block
├── deploy.sh           # One-command deploy script
└── .env.production     # Set VITE_API_URL here before building
```

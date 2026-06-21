# ================================================================
#  PastPapers RIUC — Vercel Environment Variables
#  Vercel Dashboard → riuc-backend2 → Settings → Environment Variables
#  Add each one, set environment to: Production + Preview + Development
# ================================================================

# ── Database (Supabase) ───────────────────────────────────────────────
# Go to: Supabase Dashboard → your project → Settings → Database
# Copy "Connection string" (URI format) and replace [YOUR-PASSWORD]

DB_URL=postgresql://postgres:[YOUR-SUPABASE-PASSWORD]@db.qhtuvzlftoswitwouyaq.supabase.co:5432/postgres

# ── JWT Auth ──────────────────────────────────────────────────────────
# DO NOT change this — it was generated fresh and is cryptographically secure

JWT_SECRET=b001b85adc1f052724d654bcab89d139487568866f72ead928473a77dd900c01b364158ef0b87d608bed2db4cdd1265a7b34748bcadf93e553fdd8304bf7f5ad
JWT_EXPIRE=7d

# ── Cloudinary ────────────────────────────────────────────────────────
# Go to: cloudinary.com/console → Dashboard → top section shows all 3
# Cloud name is the first thing you see on the dashboard

CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

# ── App settings ──────────────────────────────────────────────────────
NODE_ENV=production
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png,image/jpg

# ── Admin seed ────────────────────────────────────────────────────────
ADMIN_EMAIL=akpehuel@gmail.com
ADMIN_PASSWORD=ChangeThis2025!

# ── CORS ─────────────────────────────────────────────────────────────
# Set this to your actual frontend Vercel URL once deployed
# e.g. https://riuc-frontend.vercel.app

FRONTEND_URL=https://riuc-frontend.vercel.app

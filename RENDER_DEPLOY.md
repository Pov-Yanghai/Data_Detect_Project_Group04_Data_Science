# Deploy to Render

This guide walks you through deploying your backend (Express) and ML service (FastAPI) to Render.

## Prerequisites
- GitHub account with this repo pushed
- Render account (free at render.com)

## Part 1: Deploy ML Service (FastAPI)

### Step 1: Create Render Account & Connect GitHub
1. Go to render.com and sign up
2. Click "New +" → "Web Service"
3. Click "Connect a repository" and authorize GitHub
4. Select your Data_Detect_Project_Group04_Data_Science repository

### Step 2: Configure ML Service
1. **Name**: `ml-service` (or your choice)
2. **Root Directory**: `ml_service` (important: only deploy this subdir)
3. **Runtime**: Docker
4. **Build Command**: (leave blank - Render auto-detects Dockerfile)
5. **Start Command**: (leave blank - Render auto-detects CMD)

### Step 3: Set Environment Variables
Click "Advanced" and add these environment variables:
```
PORT=8000
WEB_CONCURRENCY=4
```

### Step 4: Deploy
- Click "Create Web Service"
- Wait for build (~10 minutes first time)
- Copy your ML Service URL, e.g., `https://ml-service-xyz.onrender.com`

**Note**: Free tier may auto-spin down after 15 minutes of inactivity. Upgrade to "Standard" ($7/month) to keep it always-on.

---

## Part 2: Deploy Backend (Express)

### Step 1: Create Another Web Service
1. Back on Render dashboard, click "New +" → "Web Service"
2. Select your GitHub repo again
3. Click "Connect"

### Step 2: Configure Backend
1. **Name**: `data-processing-api` (or your choice)
2. **Root Directory**: `server` (important: only deploy this subdir)
3. **Runtime**: Node
4. **Build Command**: `npm ci`
5. **Start Command**: `npm start`

### Step 3: Set Environment Variables
Click "Advanced" and add:
```
NODE_ENV=production
PORT=5000
ML_SERVICE_URL=https://your-ml-service-url.onrender.com
FRONTEND_URL=https://your-app.vercel.app
```

Replace:
- `https://your-ml-service-url.onrender.com` with your ML Service URL from Part 1
- `https://your-app.vercel.app` with your Vercel frontend URL (add after frontend is deployed)

### Step 4: Deploy
- Click "Create Web Service"
- Wait for build
- Copy your Backend URL, e.g., `https://data-processing-api-xyz.onrender.com`

---

## Part 3: Test Backend

Once deployed, test your backend health endpoints:

```bash
# ML Service health
curl https://ml-service-xyz.onrender.com/health

# Backend health
curl https://data-processing-api-xyz.onrender.com/api/health
```

Both should return `{"status": "ok", "service": "..."}`.

---

## Part 4: Update Vercel Frontend

1. Go to your Vercel project settings
2. Add environment variable:
   - **NEXT_PUBLIC_API_URL** = `https://data-processing-api-xyz.onrender.com/api`
3. Click "Redeploy"
4. Open your Vercel domain and verify API calls work

---

## Important Notes

**Free Tier Limitations (Render)**
- Services spin down after 15 min of inactivity (~5 min resume time)
- Limited to 750 build minutes/month per account
- For always-on: upgrade to Standard ($7/month per service)

**Auto-Redeploy on Push**
- Render automatically redeploys when you push to main
- Monitor builds in Render dashboard

**Logs**
- Render dashboard shows live logs for debugging
- Frontend will show clear errors if backend is unreachable

**CORS**
- Backend CORS is set to only allow requests from FRONTEND_URL in production
- If you get CORS errors after deploying, check Vercel and Render URLs match exactly

---

## Troubleshooting

### Backend can't reach ML Service
- Verify ML_SERVICE_URL is correct in backend env vars
- Check both services are running (green status in Render)

### Frontend gets connection refused
- Verify NEXT_PUBLIC_API_URL is correct in Vercel
- Check backend service is running
- Wait 5 min if services just deployed

### File uploads fail
- Check upload volume persists (Render free tier doesn't persist volumes)
- Upgrade to Render Disk for persistent storage

### ML Service too slow
- Render free tier has limited CPU
- Upgrade to Standard or higher

---

## Next: Keep Deployment Updated

After initial deployment, every time you push to `main`:
1. Render auto-rebuilds both services
2. Vercel auto-redeploys frontend (if using auto-deploy)
3. Changes go live in ~2-5 minutes

Done with deployment!

# Vercel Deployment Guide

This project should be deployed as:
- Frontend (Next.js): Vercel
- Backend (Express) + ML service (FastAPI): a container host (Render, Railway, Fly.io, DigitalOcean, AWS, etc.)

## Why this split
Vercel is excellent for Next.js frontend hosting. Your backend and ML service are long-running server processes and are better suited to container hosting.

## 1) Deploy Backend + ML Service first
Use your existing Docker setup in this repo:
- server/Dockerfile
- ml_service/Dockerfile
- docker-compose.yml (for local testing)

After deployment, note your backend public URL, for example:
https://api-yourapp.example.com

## 2) Deploy Frontend to Vercel
1. Push your code to GitHub.
2. In Vercel dashboard, click New Project and import this repository.
3. Framework preset: Next.js
4. Root directory: project root (Detection_Dataset)
5. Package manager: pnpm

## 3) Set Vercel environment variable
Add this variable in Vercel project settings:
- NEXT_PUBLIC_API_URL = https://api-yourapp.example.com/api

Set it for Production (and Preview if needed), then redeploy.

## 4) Verify
- Frontend URL opens on Vercel
- API calls go to your backend domain
- Health endpoint works at https://api-yourapp.example.com/api/health

## Optional: Vercel CLI
If you prefer CLI:
1. npm i -g vercel
2. vercel
3. vercel --prod

Make sure NEXT_PUBLIC_API_URL is set before production deploy.

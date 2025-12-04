# ⚡ Railway Quick Start (10 Minutes)

Deploy your Vietnamese Food Detection backend in 10 minutes.

## Step 1: Create Railway Account (2 min)

1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway

## Step 2: Deploy Project (3 min)

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose `vn-food-detection`
4. Select `mobile-app` branch
5. Set root directory: `mobile-app/server`
6. Click "Deploy"

## Step 3: Generate Domain (1 min)

1. Wait for build to complete (3-5 min)
2. Go to "Settings" tab
3. Scroll to "Domains"
4. Click "Generate Domain"
5. Copy your URL: `https://your-app.railway.app`

## Step 4: Test API (1 min)

```bash
curl https://your-app.railway.app/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "nutrition_data_loaded": true
}
```

## Step 5: Update Mobile App (3 min)

Edit `mobile-app/VNFoodDetection/.env.production`:
```
API_BASE_URL=https://your-app.railway.app
API_TIMEOUT=30000
```

Rebuild mobile app:
```bash
cd mobile-app/VNFoodDetection

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

## Done! 🎉

Your backend is live and ready to detect Vietnamese food!

## Troubleshooting

**Build fails?**
- Check Railway logs in dashboard
- Verify all files are committed

**API not responding?**
- Wait 5 minutes for full startup
- Model loading takes time

**Mobile app can't connect?**
- Check API_BASE_URL in .env.production
- Verify domain is correct
- Test with curl first

## Next Steps

- Read full guide: `RAILWAY_DEPLOYMENT.md`
- Monitor logs in Railway dashboard
- Test with mobile app
- Share your app!

---

**Total Time:** ~10 minutes
**Cost:** Free tier (500 hours/month)

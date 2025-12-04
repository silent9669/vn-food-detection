# 🚀 Railway Deployment Guide

Complete guide for deploying the Vietnamese Food Detection backend to Railway.

## Prerequisites

- GitHub account with repository access
- Railway account (free tier available)
- Model file: `efficientnet_b4_classifier.pth` (68MB)
- Nutrition data: `labels.csv` (1MB)

## Quick Deploy (10 minutes)

### 1. Prepare Repository

All files are already in place:
```
mobile-app/server/
├── main.py                              # FastAPI application
├── requirements.txt                     # Python dependencies
├── railway.json                         # Railway configuration
├── Procfile                            # Process definition
├── models/
│   └── efficientnet_b4_classifier.pth  # Trained model (68MB)
└── data_master/
    └── labels.csv                      # Nutrition data (1MB)
```

### 2. Deploy to Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `vn-food-detection` repository
   - Select `mobile-app` branch

3. **Configure Service**
   - Railway will auto-detect Python project
   - Set root directory: `mobile-app/server`
   - Railway will use `railway.json` configuration

4. **Set Environment Variables** (Optional)
   ```
   PORT=8000                    # Auto-set by Railway
   PYTHON_VERSION=3.11          # Auto-detected
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 3-5 minutes for build
   - Railway will install dependencies and start server

### 3. Get Your API URL

After deployment:
1. Go to your Railway project
2. Click on your service
3. Go to "Settings" tab
4. Find "Domains" section
5. Click "Generate Domain"
6. Copy the URL (e.g., `https://your-app.railway.app`)

### 4. Update Mobile App

Update `.env.production` in mobile app:
```bash
cd mobile-app/VNFoodDetection
```

Edit `.env.production`:
```
API_BASE_URL=https://your-app.railway.app
API_TIMEOUT=30000
```

### 5. Test Deployment

Test health endpoint:
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

## Configuration Details

### railway.json
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Procfile
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2
```

## Monitoring

### View Logs
1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Click on latest deployment
5. View real-time logs

### Check Metrics
- CPU usage
- Memory usage
- Request count
- Response times

### Health Checks
Railway automatically monitors:
- HTTP health endpoint
- Process uptime
- Memory limits

## Scaling

### Free Tier Limits
- 500 hours/month
- 512MB RAM
- 1GB disk
- Shared CPU

### Upgrade Options
- **Hobby Plan** ($5/month)
  - 8GB RAM
  - 100GB disk
  - Priority support

- **Pro Plan** ($20/month)
  - 32GB RAM
  - 100GB disk
  - Custom domains
  - Team collaboration

### Auto-Scaling
Railway automatically:
- Restarts on failure (max 10 retries)
- Scales based on traffic
- Manages SSL certificates

## Troubleshooting

### Build Fails

**Issue:** Dependencies installation fails
```
Solution: Check requirements.txt versions
- Ensure PyTorch version is compatible
- Use specific versions (not latest)
```

**Issue:** Model file not found
```
Solution: Verify model file is committed
cd mobile-app/server
git lfs track "*.pth"
git add models/efficientnet_b4_classifier.pth
git commit -m "Add model file"
git push
```

### Runtime Errors

**Issue:** Out of memory
```
Solution: Reduce workers in Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
```

**Issue:** Slow response times
```
Solution: Upgrade to Hobby plan for more resources
```

### API Errors

**Issue:** CORS errors from mobile app
```
Solution: Check CORS configuration in main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Issue:** 502 Bad Gateway
```
Solution: Check logs for startup errors
- Model loading issues
- Port binding problems
```

## Security

### Environment Variables
Store sensitive data in Railway environment variables:
- API keys
- Database credentials
- Secret tokens

### HTTPS
Railway provides automatic HTTPS:
- Free SSL certificates
- Auto-renewal
- Force HTTPS redirect

### Rate Limiting
Add rate limiting in main.py:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/v1/detect")
@limiter.limit("10/minute")
async def detect_food(image: UploadFile):
    # Detection logic
    pass
```

## Cost Optimization

### Free Tier Tips
- Use 1 worker instead of 2
- Implement request caching
- Optimize model loading
- Use lazy loading for dependencies

### Monitoring Costs
- Check usage in Railway dashboard
- Set up billing alerts
- Monitor monthly hours

## CI/CD

### Auto-Deploy on Push
Railway automatically deploys when you push to `mobile-app` branch:

```bash
git checkout mobile-app
git add .
git commit -m "Update backend"
git push origin mobile-app
```

Railway will:
1. Detect changes
2. Build new image
3. Run tests (if configured)
4. Deploy new version
5. Zero-downtime deployment

### Rollback
If deployment fails:
1. Go to "Deployments" tab
2. Find previous working deployment
3. Click "Redeploy"

## Performance Tips

### Model Loading
Load model once at startup:
```python
@app.on_event("startup")
async def load_model():
    global model
    model = load_efficientnet_model()
```

### Caching
Implement response caching:
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_nutrition_data(dish_name: str):
    return nutrition_db[dish_name]
```

### Async Processing
Use async for I/O operations:
```python
@app.post("/api/v1/detect")
async def detect_food(image: UploadFile):
    image_data = await image.read()
    result = await process_image(image_data)
    return result
```

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Test API endpoints
3. ✅ Update mobile app configuration
4. ✅ Test mobile app with production backend
5. ✅ Monitor logs and metrics
6. ✅ Set up alerts
7. ✅ Plan for scaling

## Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Project Issues:** GitHub Issues

---

**Deployment Status:** Ready to deploy
**Estimated Time:** 10-15 minutes
**Cost:** Free tier available

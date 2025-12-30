@echo off
REM 🚀 BitSwapDEX Frontend - Deploy to S3 (Windows)
REM Usage: deploy-s3.bat

echo 🔨 Building frontend...
call npm run build

if %errorlevel% neq 0 (
  echo ❌ Build failed!
  exit /b %errorlevel%
)

echo 📦 Deploying to S3...
aws s3 sync build\ s3://bits-ai.io --delete --cache-control "max-age=31536000,public"

REM Invalidate CloudFront cache (optional)
REM aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo ✅ Deploy complete! 🚀
pause


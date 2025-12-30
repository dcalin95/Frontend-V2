#!/bin/bash

# 🚀 BitSwapDEX Frontend - Deploy to S3
# Usage: ./deploy-s3.sh

echo "🔨 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "📦 Deploying to S3..."
aws s3 sync build/ s3://bits-ai.io --delete --cache-control "max-age=31536000,public"

# Invalidate CloudFront cache (optional - dacă folosești CloudFront)
# aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "✅ Deploy complete! 🚀"


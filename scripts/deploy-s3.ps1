# 🚀 BitSwapDEX - S3 Deploy Script (PowerShell pentru Windows)
# Scriptul automatizat pentru deploy pe S3

param(
    [string]$BucketName = $env:S3_BUCKET_NAME,
    [string]$CloudFrontId = $env:CLOUDFRONT_DISTRIBUTION_ID
)

# Verifică AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "✗ AWS CLI nu este instalat!" -ForegroundColor Red
    Write-Host "Instalează AWS CLI: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Verifică Bucket Name
if ([string]::IsNullOrEmpty($BucketName)) {
    Write-Host "✗ S3_BUCKET_NAME nu este setat!" -ForegroundColor Red
    Write-Host "Setează cu: `$env:S3_BUCKET_NAME='numele-bucket-ului-tau'" -ForegroundColor Yellow
    exit 1
}

Write-Host "==> Starting BitSwapDEX deployment to S3..." -ForegroundColor Blue

# 1. Clean previous build
Write-Host "==> Cleaning previous build..." -ForegroundColor Blue
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
Write-Host "✓ Build folder cleaned" -ForegroundColor Green

# 2. Build React App
Write-Host "==> Building React application..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build completed successfully" -ForegroundColor Green

# 3. Sync to S3
Write-Host "==> Uploading to S3 bucket: $BucketName" -ForegroundColor Blue

# Upload static assets with long cache (1 year)
Write-Host "  Uploading static assets..." -ForegroundColor Cyan
aws s3 sync build/static s3://$BucketName/static `
    --delete `
    --cache-control "public,max-age=31536000,immutable" `
    --metadata-directive REPLACE

# Upload index.html and error pages WITHOUT cache
Write-Host "  Uploading index.html and error pages..." -ForegroundColor Cyan
aws s3 cp build/index.html s3://$BucketName/ `
    --cache-control "no-cache,no-store,must-revalidate" `
    --metadata-directive REPLACE

aws s3 cp build/404.html s3://$BucketName/ `
    --cache-control "no-cache,no-store,must-revalidate" `
    --metadata-directive REPLACE

aws s3 cp build/_error.html s3://$BucketName/ `
    --cache-control "no-cache,no-store,must-revalidate" `
    --metadata-directive REPLACE

# Upload all other files
Write-Host "  Uploading remaining files..." -ForegroundColor Cyan
aws s3 sync build/ s3://$BucketName/ `
    --delete `
    --exclude "index.html" `
    --exclude "404.html" `
    --exclude "_error.html" `
    --exclude "static/*" `
    --cache-control "public,max-age=3600"

Write-Host "✓ Files uploaded to S3" -ForegroundColor Green

# 4. Invalidate CloudFront (dacă există)
if (-not [string]::IsNullOrEmpty($CloudFrontId)) {
    Write-Host "==> Invalidating CloudFront cache..." -ForegroundColor Blue
    aws cloudfront create-invalidation `
        --distribution-id $CloudFrontId `
        --paths "/*" | Out-Null
    Write-Host "✓ CloudFront cache invalidated" -ForegroundColor Green
} else {
    Write-Host "⚠ CLOUDFRONT_DISTRIBUTION_ID not set. Skipping cache invalidation." -ForegroundColor Yellow
    Write-Host "  If you use CloudFront, set: `$env:CLOUDFRONT_DISTRIBUTION_ID='your-distribution-id'" -ForegroundColor Yellow
}

# 5. Success
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is now live at:"
Write-Host "https://$BucketName.s3-website-YOUR-REGION.amazonaws.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test the AI Hub routes:"
Write-Host "  - https://your-domain.com/ai-hub" -ForegroundColor Cyan
Write-Host "  - https://your-domain.com/ai-hub/market-oracle" -ForegroundColor Cyan
Write-Host "  - https://your-domain.com/ai-hub/portfolio-stress" -ForegroundColor Cyan
Write-Host ""


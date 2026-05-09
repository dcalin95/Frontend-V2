# BitSwapDEX - S3 Deploy Script (PowerShell pentru Windows)
# Scriptul automatizat pentru deploy pe S3

param(
    [string]$BucketName = $env:S3_BUCKET_NAME,
    [string]$CloudFrontId = $env:CLOUDFRONT_DISTRIBUTION_ID
)

# Default CloudFront Distribution ID pentru bits-ai.io (daca nu e setat in env)
if ([string]::IsNullOrEmpty($CloudFrontId) -and $BucketName -eq "bits-ai.io") {
    $CloudFrontId = "E2TIH6RJTHIT1M"
}

# Verifica AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Host "AWS CLI nu este instalat!" -ForegroundColor Red
    Write-Host "Instaleaza AWS CLI: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Verifica Bucket Name
if ([string]::IsNullOrEmpty($BucketName)) {
    Write-Host "S3_BUCKET_NAME nu este setat!" -ForegroundColor Red
    Write-Host "Setaza cu: `$env:S3_BUCKET_NAME='numele-bucket-ului-tau'" -ForegroundColor Yellow
    exit 1
}

Write-Host "==> Starting BitSwapDEX deployment to S3..." -ForegroundColor Blue

# 1. Clean previous build
Write-Host "==> Cleaning previous build..." -ForegroundColor Blue
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}
Write-Host "Build folder cleaned" -ForegroundColor Green

# 2. Build React App
Write-Host "==> Building React application..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed successfully" -ForegroundColor Green

# 3. Sync to S3
Write-Host "==> Uploading to S3 bucket: $BucketName" -ForegroundColor Blue

# Upload static assets with long cache (1 year)
Write-Host "  Uploading static assets..." -ForegroundColor Cyan
aws s3 sync build/static "s3://$BucketName/static" --delete --cache-control "public,max-age=31536000,immutable" --metadata-directive REPLACE

# Upload index.html WITHOUT cache
Write-Host "  Uploading index.html..." -ForegroundColor Cyan
aws s3 cp build/index.html "s3://$BucketName/" --cache-control "no-cache,no-store,must-revalidate" --metadata-directive REPLACE

# Upload error pages WITHOUT cache (if they exist)
if (Test-Path "build/404.html") {
    Write-Host "  Uploading 404.html..." -ForegroundColor Cyan
    aws s3 cp build/404.html "s3://$BucketName/" --cache-control "no-cache,no-store,must-revalidate" --metadata-directive REPLACE
}

if (Test-Path "build/_error.html") {
    Write-Host "  Uploading _error.html..." -ForegroundColor Cyan
    aws s3 cp build/_error.html "s3://$BucketName/" --cache-control "no-cache,no-store,must-revalidate" --metadata-directive REPLACE
}

# Upload all other files
Write-Host "  Uploading remaining files..." -ForegroundColor Cyan
aws s3 sync build/ "s3://$BucketName/" --delete --exclude "index.html" --exclude "404.html" --exclude "_error.html" --exclude "static/*" --cache-control "public,max-age=3600"

Write-Host "Files uploaded to S3" -ForegroundColor Green

# 4. Invalidate CloudFront (daca exista)
if (-not [string]::IsNullOrEmpty($CloudFrontId)) {
    Write-Host "==> Invalidating CloudFront cache..." -ForegroundColor Blue
    $pathsArg = "/*"
    aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths $pathsArg | Out-Null
    Write-Host "CloudFront cache invalidated" -ForegroundColor Green
} else {
    Write-Host "CLOUDFRONT_DISTRIBUTION_ID not set. Skipping cache invalidation." -ForegroundColor Yellow
    Write-Host "  If you use CloudFront, set: `$env:CLOUDFRONT_DISTRIBUTION_ID='your-distribution-id'" -ForegroundColor Yellow
}

# 5. Success
Write-Host ""
Write-Host "Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is now live at:"
Write-Host "https://$BucketName" -ForegroundColor Cyan
Write-Host ""

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

# 2.1 Preserve/inject runtime-only OTA secrets before uploading runtime-config.json.
# GitHub Actions injects these from repository secrets; local deploys should not wipe them.
$RuntimeConfigPath = "build/runtime-config.json"
if (Test-Path $RuntimeConfigPath) {
    $runtimeConfig = Get-Content $RuntimeConfigPath -Raw | ConvertFrom-Json

    $shortSecret = if (-not [string]::IsNullOrWhiteSpace($env:REACT_APP_OTA_SHORT_OPS_SECRET)) {
        $env:REACT_APP_OTA_SHORT_OPS_SECRET.Trim()
    } elseif (-not [string]::IsNullOrWhiteSpace($env:OTA_SHORT_OPS_SECRET)) {
        $env:OTA_SHORT_OPS_SECRET.Trim()
    } else {
        ""
    }

    $longSecret = if (-not [string]::IsNullOrWhiteSpace($env:REACT_APP_OTA_LONG_OPS_SECRET)) {
        $env:REACT_APP_OTA_LONG_OPS_SECRET.Trim()
    } elseif (-not [string]::IsNullOrWhiteSpace($env:OTA_LONG_OPS_SECRET)) {
        $env:OTA_LONG_OPS_SECRET.Trim()
    } else {
        ""
    }

    if ([string]::IsNullOrWhiteSpace($shortSecret) -or [string]::IsNullOrWhiteSpace($longSecret)) {
        $existingRuntimeConfig = $null
        $tempRuntimeConfig = Join-Path $env:TEMP ("runtime-config-" + [guid]::NewGuid().ToString("N") + ".json")

        aws s3 cp "s3://$BucketName/runtime-config.json" $tempRuntimeConfig --only-show-errors 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0 -and (Test-Path $tempRuntimeConfig)) {
            try {
                $existingRuntimeConfig = Get-Content $tempRuntimeConfig -Raw | ConvertFrom-Json
            } catch {
                Write-Host "  Existing runtime-config.json could not be parsed; skipping secret preservation." -ForegroundColor Yellow
            }
        }
        if (Test-Path $tempRuntimeConfig) {
            Remove-Item -Force $tempRuntimeConfig
        }

        if ([string]::IsNullOrWhiteSpace($shortSecret) -and $existingRuntimeConfig -and $existingRuntimeConfig.OTA_SHORT_OPS_SECRET) {
            $shortSecret = [string]$existingRuntimeConfig.OTA_SHORT_OPS_SECRET
        }
        if ([string]::IsNullOrWhiteSpace($longSecret) -and $existingRuntimeConfig -and $existingRuntimeConfig.OTA_LONG_OPS_SECRET) {
            $longSecret = [string]$existingRuntimeConfig.OTA_LONG_OPS_SECRET
        }
    }

    if (-not [string]::IsNullOrWhiteSpace($shortSecret)) {
        $runtimeConfig | Add-Member -NotePropertyName "OTA_SHORT_OPS_SECRET" -NotePropertyValue $shortSecret -Force
    }
    if (-not [string]::IsNullOrWhiteSpace($longSecret)) {
        $runtimeConfig | Add-Member -NotePropertyName "OTA_LONG_OPS_SECRET" -NotePropertyValue $longSecret -Force
    }

    $runtimeConfigJson = $runtimeConfig | ConvertTo-Json -Depth 20
    [System.IO.File]::WriteAllText(
        (Resolve-Path $RuntimeConfigPath),
        $runtimeConfigJson + [Environment]::NewLine,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Host "Runtime OTA secrets prepared for deploy (short=$(-not [string]::IsNullOrWhiteSpace($shortSecret)), long=$(-not [string]::IsNullOrWhiteSpace($longSecret)); values hidden)." -ForegroundColor Green
} else {
    Write-Host "runtime-config.json missing from build; skipping OTA secret injection." -ForegroundColor Yellow
}

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

#!/bin/bash

# 🚀 BitSwapDEX - S3 Deploy Script
# Scriptul automatizat pentru deploy pe S3

set -euo pipefail # Exit pe orice eroare, variabila lipsa sau pipe esuat

# Culori pentru output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funcție pentru print colorat
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verifică dacă AWS CLI este instalat
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI nu este instalat!"
    echo "Instalează AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Verifică variabilele de mediu
if [ -z "${S3_BUCKET_NAME:-}" ]; then
    print_error "Variabila S3_BUCKET_NAME nu este setată!"
    echo "Setează-o cu: export S3_BUCKET_NAME=numele-bucket-ului-tau"
    exit 1
fi

if [ -z "${CLOUDFRONT_DISTRIBUTION_ID:-}" ] && [ "$S3_BUCKET_NAME" = "bits-ai.io" ]; then
    CLOUDFRONT_DISTRIBUTION_ID="E2TIH6RJTHIT1M"
fi

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=6144}"

print_step "Starting BitSwapDEX deployment to S3..."

# 1. Clean previous build
print_step "Cleaning previous build..."
rm -rf build/
print_success "Build folder cleaned"

# 2. Build React App
print_step "Building React application..."
npm run build
print_success "Build completed successfully"

if [ ! -f build/index.html ] || [ ! -d build/static ]; then
    print_error "Build artifacts are incomplete: build/index.html or build/static is missing."
    exit 1
fi

# 2b. Inject OTA ops secrets into runtime config when provided.
RUNTIME_CONFIG_PATH="build/runtime-config.json"
SHORT_OPS_SECRET="${REACT_APP_OTA_SHORT_OPS_SECRET:-${OTA_SHORT_OPS_SECRET:-}}"
LONG_OPS_SECRET="${REACT_APP_OTA_LONG_OPS_SECRET:-${OTA_LONG_OPS_SECRET:-$SHORT_OPS_SECRET}}"

# Preserve deployed secrets when the local/CI shell does not provide them.
if { [ -z "$SHORT_OPS_SECRET" ] || [ -z "$LONG_OPS_SECRET" ]; } && [ -f "$RUNTIME_CONFIG_PATH" ]; then
    REMOTE_RUNTIME_CONFIG="$(mktemp)"
    if aws s3 cp "s3://$S3_BUCKET_NAME/runtime-config.json" "$REMOTE_RUNTIME_CONFIG" --only-show-errors 2>/dev/null; then
        REMOTE_RUNTIME_CONFIG="$REMOTE_RUNTIME_CONFIG" node <<'NODE'
const fs = require('fs');
const buildPath = 'build/runtime-config.json';
const remotePath = process.env.REMOTE_RUNTIME_CONFIG;
const build = JSON.parse(fs.readFileSync(buildPath, 'utf8'));
const remote = JSON.parse(fs.readFileSync(remotePath, 'utf8'));
const shortFromEnv = String(process.env.REACT_APP_OTA_SHORT_OPS_SECRET || process.env.OTA_SHORT_OPS_SECRET || '').trim();
const longFromEnv = String(process.env.REACT_APP_OTA_LONG_OPS_SECRET || process.env.OTA_LONG_OPS_SECRET || '').trim();
if (!shortFromEnv && remote.OTA_SHORT_OPS_SECRET) build.OTA_SHORT_OPS_SECRET = remote.OTA_SHORT_OPS_SECRET;
if (!longFromEnv && remote.OTA_LONG_OPS_SECRET) build.OTA_LONG_OPS_SECRET = remote.OTA_LONG_OPS_SECRET;
fs.writeFileSync(buildPath, `${JSON.stringify(build, null, 2)}\n`, 'utf8');
NODE
    fi
    rm -f "$REMOTE_RUNTIME_CONFIG"
fi

if [ -n "$SHORT_OPS_SECRET" ] || [ -n "$LONG_OPS_SECRET" ]; then
    if [ -f "$RUNTIME_CONFIG_PATH" ]; then
        print_step "Injecting OTA ops secrets into runtime config..."
        node <<'NODE'
const fs = require('fs');
const path = 'build/runtime-config.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const shortSecret = String(process.env.REACT_APP_OTA_SHORT_OPS_SECRET || process.env.OTA_SHORT_OPS_SECRET || '').trim();
const longSecret = String(process.env.REACT_APP_OTA_LONG_OPS_SECRET || process.env.OTA_LONG_OPS_SECRET || shortSecret || '').trim();
if (shortSecret) data.OTA_SHORT_OPS_SECRET = shortSecret;
if (longSecret) data.OTA_LONG_OPS_SECRET = longSecret;
fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
console.log('OTA ops secrets injected into runtime-config.json (values hidden).');
NODE
    else
        print_warning "runtime-config.json missing in build; skipping OTA ops secret injection."
    fi
else
    print_warning "No OTA ops secrets found in env; runtime-config.json not modified."
fi

# 3. Sync to S3
print_step "Uploading to S3 bucket: $S3_BUCKET_NAME"

print_step "Validating AWS target access..."
aws sts get-caller-identity --query 'Account' --output text > /dev/null
aws s3api head-bucket --bucket "$S3_BUCKET_NAME"
if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
    aws cloudfront get-distribution \
        --id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --query 'Distribution.Status' \
        --output text > /dev/null
fi
print_success "AWS identity, S3 bucket, and CloudFront target are reachable"

# Upload static assets with long cache (1 year)
aws s3 sync build/static "s3://$S3_BUCKET_NAME/static" \
    --cache-control "public,max-age=31536000,immutable" \
    --metadata-directive REPLACE

# Upload index.html and error pages WITHOUT cache
aws s3 cp build/index.html "s3://$S3_BUCKET_NAME/" \
    --cache-control "no-cache,no-store,must-revalidate" \
    --metadata-directive REPLACE

if [ -f build/runtime-config.json ]; then
    aws s3 cp build/runtime-config.json "s3://$S3_BUCKET_NAME/" \
        --cache-control "no-cache,no-store,must-revalidate" \
        --metadata-directive REPLACE \
        --content-type "application/json"
fi

if [ -f build/404.html ]; then
    aws s3 cp build/404.html "s3://$S3_BUCKET_NAME/" \
        --cache-control "no-cache,no-store,must-revalidate" \
        --metadata-directive REPLACE
fi

if [ -f build/_error.html ]; then
    aws s3 cp build/_error.html "s3://$S3_BUCKET_NAME/" \
        --cache-control "no-cache,no-store,must-revalidate" \
        --metadata-directive REPLACE
fi

# Upload all other files
aws s3 sync build/ "s3://$S3_BUCKET_NAME/" \
    --delete \
    --exclude "index.html" \
    --exclude "runtime-config.json" \
    --exclude "404.html" \
    --exclude "_error.html" \
    --exclude "static/*" \
    --cache-control "public,max-age=3600"

print_success "Files uploaded to S3"

# 4. Invalidate CloudFront (dacă există)
if [ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]; then
    print_step "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        > /dev/null
    print_success "CloudFront cache invalidated"
else
    print_warning "CLOUDFRONT_DISTRIBUTION_ID not set. Skipping cache invalidation."
    echo "If you use CloudFront, set: export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id"
fi

# 5. Success
echo ""
print_success "🎉 Deployment completed successfully!"
echo ""
echo "Your app is now live at:"
echo "https://$S3_BUCKET_NAME.s3-website-YOUR-REGION.amazonaws.com"
echo ""
echo "Test the AI Hub routes:"
echo "  - https://your-domain.com/ai-hub"
echo "  - https://your-domain.com/ai-hub/market-oracle"
echo "  - https://your-domain.com/ai-hub/portfolio-stress"
echo ""

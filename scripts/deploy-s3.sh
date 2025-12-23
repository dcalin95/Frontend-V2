#!/bin/bash

# 🚀 BitSwapDEX - S3 Deploy Script
# Scriptul automatizat pentru deploy pe S3

set -e # Exit pe orice eroare

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
if [ -z "$S3_BUCKET_NAME" ]; then
    print_error "Variabila S3_BUCKET_NAME nu este setată!"
    echo "Setează-o cu: export S3_BUCKET_NAME=numele-bucket-ului-tau"
    exit 1
fi

print_step "Starting BitSwapDEX deployment to S3..."

# 1. Clean previous build
print_step "Cleaning previous build..."
rm -rf build/
print_success "Build folder cleaned"

# 2. Build React App
print_step "Building React application..."
npm run build
print_success "Build completed successfully"

# 3. Sync to S3
print_step "Uploading to S3 bucket: $S3_BUCKET_NAME"

# Upload static assets with long cache (1 year)
aws s3 sync build/static s3://$S3_BUCKET_NAME/static \
    --delete \
    --cache-control "public,max-age=31536000,immutable" \
    --metadata-directive REPLACE

# Upload index.html and error pages WITHOUT cache
aws s3 cp build/index.html s3://$S3_BUCKET_NAME/ \
    --cache-control "no-cache,no-store,must-revalidate" \
    --metadata-directive REPLACE

aws s3 cp build/404.html s3://$S3_BUCKET_NAME/ \
    --cache-control "no-cache,no-store,must-revalidate" \
    --metadata-directive REPLACE

aws s3 cp build/_error.html s3://$S3_BUCKET_NAME/ \
    --cache-control "no-cache,no-store,must-revalidate" \
    --metadata-directive REPLACE

# Upload all other files
aws s3 sync build/ s3://$S3_BUCKET_NAME/ \
    --delete \
    --exclude "index.html" \
    --exclude "404.html" \
    --exclude "_error.html" \
    --exclude "static/*" \
    --cache-control "public,max-age=3600"

print_success "Files uploaded to S3"

# 4. Invalidate CloudFront (dacă există)
if [ ! -z "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
    print_step "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
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


#!/bin/bash

# 🛠️ BitSwapDEX - S3 Bucket Setup Script
# Scriptul pentru configurarea inițială a bucket-ului S3

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Verifică dacă AWS CLI este instalat
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI nu este instalat!"
    exit 1
fi

# Solicită numele bucket-ului
read -p "Enter S3 Bucket Name: " BUCKET_NAME
read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

print_step "Setting up S3 bucket: $BUCKET_NAME"

# 1. Creează bucket-ul
print_step "Creating S3 bucket..."
if [ "$AWS_REGION" = "us-east-1" ]; then
    aws s3api create-bucket --bucket $BUCKET_NAME --region $AWS_REGION
else
    aws s3api create-bucket \
        --bucket $BUCKET_NAME \
        --region $AWS_REGION \
        --create-bucket-configuration LocationConstraint=$AWS_REGION
fi
print_success "Bucket created"

# 2. Enable Static Website Hosting
print_step "Enabling static website hosting..."
aws s3 website s3://$BUCKET_NAME/ \
    --index-document index.html \
    --error-document 404.html
print_success "Static website hosting enabled"

# 3. Set Bucket Policy (Public Read)
print_step "Setting bucket policy for public access..."
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

# Disable Block Public Access
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Apply Bucket Policy
aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file:///tmp/bucket-policy.json

rm /tmp/bucket-policy.json
print_success "Bucket policy applied"

# 4. Export environment variables
print_step "Configuring environment variables..."
echo ""
echo "Add these to your .env or .bashrc:"
echo ""
echo "export S3_BUCKET_NAME=$BUCKET_NAME"
echo "export AWS_REGION=$AWS_REGION"
echo ""

# Get website URL
WEBSITE_URL=$(aws s3api get-bucket-website --bucket $BUCKET_NAME --query 'WebsiteConfiguration.IndexDocument.Suffix' --output text 2>/dev/null || echo "index.html")

print_success "S3 Bucket configured successfully!"
echo ""
echo "Website URL: http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
echo ""
echo "Next steps:"
echo "1. Set environment variables (see above)"
echo "2. Run: ./scripts/deploy-s3.sh"
echo "3. (Optional) Setup CloudFront for HTTPS"
echo ""


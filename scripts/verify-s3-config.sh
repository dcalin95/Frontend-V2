#!/bin/bash

# 🔍 BitSwapDEX - S3 Configuration Verification Script
# Scriptul pentru verificarea configurării S3

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_check() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Verifică variabila bucket
if [ -z "$S3_BUCKET_NAME" ]; then
    print_fail "S3_BUCKET_NAME nu este setat!"
    echo "Setează cu: export S3_BUCKET_NAME=numele-bucket-ului-tau"
    exit 1
fi

BUCKET_NAME=$S3_BUCKET_NAME

echo "========================================"
echo "  S3 Configuration Verification"
echo "  Bucket: $BUCKET_NAME"
echo "========================================"
echo ""

# 1. Verifică dacă bucket-ul există
print_check "Checking if bucket exists..."
if aws s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    print_pass "Bucket exists"
else
    print_fail "Bucket does not exist or you don't have access"
    exit 1
fi

# 2. Verifică Static Website Hosting
print_check "Checking Static Website Hosting configuration..."
WEBSITE_CONFIG=$(aws s3api get-bucket-website --bucket $BUCKET_NAME 2>/dev/null)
if [ $? -eq 0 ]; then
    print_pass "Static Website Hosting is enabled"
    
    # Verifică Error Document
    ERROR_DOC=$(echo $WEBSITE_CONFIG | grep -o '"Key": "[^"]*"' | cut -d'"' -f4)
    if [ "$ERROR_DOC" = "404.html" ]; then
        print_pass "Error Document is set to 404.html"
    else
        print_fail "Error Document is NOT set to 404.html (current: $ERROR_DOC)"
    fi
else
    print_fail "Static Website Hosting is NOT enabled"
    print_info "Enable it with: aws s3 website s3://$BUCKET_NAME/ --index-document index.html --error-document 404.html"
fi

# 3. Verifică Public Access Block
print_check "Checking Public Access Block settings..."
PUBLIC_ACCESS=$(aws s3api get-public-access-block --bucket $BUCKET_NAME 2>/dev/null)
if [ $? -eq 0 ]; then
    if echo $PUBLIC_ACCESS | grep -q '"BlockPublicAcls": false' && \
       echo $PUBLIC_ACCESS | grep -q '"BlockPublicPolicy": false' && \
       echo $PUBLIC_ACCESS | grep -q '"IgnorePublicAcls": false' && \
       echo $PUBLIC_ACCESS | grep -q '"RestrictPublicBuckets": false'; then
        print_pass "Public Access is NOT blocked (good for public website)"
    else
        print_fail "Public Access is partially or fully BLOCKED"
        print_info "Unblock with: aws s3api put-public-access-block --bucket $BUCKET_NAME --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    fi
else
    print_pass "No Public Access Block set (public access allowed)"
fi

# 4. Verifică Bucket Policy
print_check "Checking Bucket Policy..."
POLICY=$(aws s3api get-bucket-policy --bucket $BUCKET_NAME 2>/dev/null)
if [ $? -eq 0 ]; then
    if echo $POLICY | grep -q '"Action": "s3:GetObject"' && \
       echo $POLICY | grep -q '"Effect": "Allow"' && \
       echo $POLICY | grep -q '"Principal": "\*"'; then
        print_pass "Bucket Policy allows public read access"
    else
        print_fail "Bucket Policy exists but might not allow public access"
    fi
else
    print_fail "No Bucket Policy found"
    print_info "Create policy for public access - see DEPLOY_INSTRUCTIONS.md"
fi

# 5. Verifică dacă fișierele importante există
print_check "Checking if critical files exist in bucket..."
FILES=("index.html" "404.html" "_error.html")
for FILE in "${FILES[@]}"; do
    if aws s3 ls "s3://$BUCKET_NAME/$FILE" &>/dev/null; then
        print_pass "$FILE exists"
    else
        print_fail "$FILE does NOT exist"
    fi
done

# 6. Verifică dacă folderul static există
print_check "Checking if static assets exist..."
if aws s3 ls "s3://$BUCKET_NAME/static/" &>/dev/null; then
    print_pass "static/ folder exists"
else
    print_fail "static/ folder does NOT exist (build might not be uploaded)"
fi

# 7. Get Website URL
print_check "Getting website endpoint..."
REGION=$(aws s3api get-bucket-location --bucket $BUCKET_NAME --query 'LocationConstraint' --output text)
if [ "$REGION" = "None" ] || [ -z "$REGION" ]; then
    REGION="us-east-1"
fi

if [ "$REGION" = "us-east-1" ]; then
    WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
else
    WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
fi

echo ""
echo "========================================"
echo "  Verification Complete"
echo "========================================"
echo ""
echo "Website URL: $WEBSITE_URL"
echo ""
echo "Test these URLs:"
echo "  - $WEBSITE_URL/"
echo "  - $WEBSITE_URL/ai-hub"
echo "  - $WEBSITE_URL/ai-hub/market-oracle"
echo "  - $WEBSITE_URL/ai-hub/portfolio-stress"
echo ""

# 8. Optional: Test 404 handling
read -p "Do you want to test 404 redirect? (y/n): " TEST_404
if [ "$TEST_404" = "y" ]; then
    print_check "Testing 404 redirect..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$WEBSITE_URL/nonexistent-page")
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
        print_pass "404 handling works (HTTP $RESPONSE)"
    else
        print_fail "Unexpected response: HTTP $RESPONSE"
    fi
fi

echo ""
echo "For full instructions, see: DEPLOY_INSTRUCTIONS.md"
echo ""


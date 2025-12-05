#!/bin/bash
# Test script for Alessa Cloud API endpoints

echo "🧪 Testing Alessa Cloud API Endpoints"
echo "======================================"
echo ""

# Get API key
if [ -f .env.local ]; then
    API_KEY=$(grep ALESSACLOUD_API_KEY .env.local | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
elif [ -f .env ]; then
    API_KEY=$(grep ALESSACLOUD_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d ' ')
else
    echo "❌ No .env file found with API key"
    exit 1
fi

if [ -z "$API_KEY" ]; then
    echo "❌ API key not found in .env files"
    exit 1
fi

echo "✅ API Key found: ${API_KEY:0:10}..."
echo ""

# Test 1: Get tenant by slug
echo "Test 1: Get tenant by slug (lasreinas)"
echo "--------------------------------------"
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "X-API-Key: $API_KEY" \
  https://alessacloud.com/api/sync/tenants/lasreinas)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d ':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Success (HTTP $HTTP_CODE)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null | head -10 || echo "$BODY" | head -5
    TENANT_ID=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('id', ''))" 2>/dev/null)
    if [ -n "$TENANT_ID" ]; then
        echo ""
        echo "📋 Tenant ID: $TENANT_ID"
    fi
else
    echo "❌ Failed (HTTP $HTTP_CODE)"
    echo "$BODY" | head -10
fi

echo ""
echo ""

# Test 2: Get tenant services (if we got tenant ID)
if [ -n "$TENANT_ID" ]; then
    echo "Test 2: Get tenant services"
    echo "--------------------------"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "X-API-Key: $API_KEY" \
      "https://alessacloud.com/api/sync/tenants/$TENANT_ID/services")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d ':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Success (HTTP $HTTP_CODE)"
        echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    else
        echo "❌ Failed (HTTP $HTTP_CODE)"
        echo "$BODY" | head -5
    fi
    echo ""
    echo ""
    
    # Test 3: Get products
    echo "Test 3: Get ordering products"
    echo "-----------------------------"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "X-API-Key: $API_KEY" \
      "https://alessacloud.com/api/sync/ordering/$TENANT_ID/products")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d ':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Success (HTTP $HTTP_CODE)"
        PRODUCT_COUNT=$(echo "$BODY" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
        echo "📦 Products found: $PRODUCT_COUNT"
        echo "$BODY" | python3 -m json.tool 2>/dev/null | head -20 || echo "$BODY" | head -10
    else
        echo "❌ Failed (HTTP $HTTP_CODE)"
        echo "$BODY" | head -5
    fi
    echo ""
    echo ""
    
    # Test 4: Get categories
    echo "Test 4: Get ordering categories"
    echo "-------------------------------"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -H "X-API-Key: $API_KEY" \
      "https://alessacloud.com/api/sync/ordering/$TENANT_ID/categories")
    
    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d ':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Success (HTTP $HTTP_CODE)"
        CATEGORY_COUNT=$(echo "$BODY" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "?")
        echo "📁 Categories found: $CATEGORY_COUNT"
        echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    else
        echo "❌ Failed (HTTP $HTTP_CODE)"
        echo "$BODY" | head -5
    fi
fi

echo ""
echo "======================================"
echo "✅ Testing complete!"


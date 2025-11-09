#!/bin/bash

# Quick Test Script - Verifies the app is running correctly
# Run this after starting the dev server (npm run dev)

set -e

BASE_URL="${1:-http://localhost:3000}"
WORKSPACE="${2:-demo-workspace}"

echo "🧪 Quick Test Suite for Insight Graph"
echo "====================================="
echo "Base URL: $BASE_URL"
echo "Workspace: $WORKSPACE"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" -eq "$expected_status" ]; then
        echo "✅ (HTTP $status)"
        return 0
    else
        echo "❌ (Expected $expected_status, got $status)"
        return 1
    fi
}

# Test home page
test_endpoint "Home page" "$BASE_URL"

# Test workspace home (might be 401 if not authenticated)
test_endpoint "Workspace home" "$BASE_URL/w/$WORKSPACE" || echo "   (Expected - requires authentication)"

# Test API endpoints (will be 401 without auth, which is correct)
echo ""
echo "Testing API endpoints (expect 401 Unauthorized - this is correct):"
test_endpoint "Items API" "$BASE_URL/api/w/$WORKSPACE/items" 401 || echo "   ⚠️  Unexpected status"
test_endpoint "Links API" "$BASE_URL/api/w/$WORKSPACE/links" 401 || echo "   ⚠️  Unexpected status"

# Test static assets
echo ""
echo "Testing static assets:"
test_endpoint "Globals CSS" "$BASE_URL/_next/static/css/app/layout.css" || echo "   (Build-dependent)"

echo ""
echo "📊 Test Summary"
echo "==============="
echo ""
echo "If you see ✅ for home page, the server is running correctly!"
echo ""
echo "To test authenticated features:"
echo "1. Open $BASE_URL in your browser"
echo "2. Sign up/login with Clerk"
echo "3. Follow the testing guide in TESTING.md"
echo ""



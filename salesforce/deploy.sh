#!/bin/bash

# Salesforce Metadata Deployment Script
# This script deploys the custom objects and platform events to Salesforce

set -e

echo "🚀 Deploying Insight Graph custom objects to Salesforce..."

# Check if Salesforce CLI is installed
if ! command -v sf &> /dev/null; then
    echo "❌ Salesforce CLI (sf) is not installed. Please install it first:"
    echo "   npm install -g @salesforce/cli"
    exit 1
fi

# Check if user is authenticated
if ! sf org display &> /dev/null; then
    echo "❌ Not authenticated with Salesforce. Please log in:"
    echo "   sf org login web"
    exit 1
fi

echo "✅ Salesforce CLI found and authenticated"

# Create temporary directory structure for deployment
TEMP_DIR=$(mktemp -d)
METADATA_DIR="$TEMP_DIR/force-app/main/default"

mkdir -p "$METADATA_DIR/objects"
mkdir -p "$METADATA_DIR/platformEvents"

echo "📦 Preparing metadata..."

# Convert JSON to XML format (you'll need to implement the conversion)
# For now, this is a placeholder - in production, you'd convert the JSON
# to proper Salesforce metadata XML format

cat > "$METADATA_DIR/objects/Insight__c.object-meta.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<CustomObject xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Insight</label>
    <pluralLabel>Insights</pluralLabel>
    <deploymentStatus>Deployed</deploymentStatus>
    <sharingModel>ReadWrite</sharingModel>
    <nameField>
        <label>Insight Name</label>
        <type>Text</type>
    </nameField>
</CustomObject>
EOF

echo "📤 Deploying to Salesforce..."

# Deploy using Salesforce CLI
cd "$TEMP_DIR"
sf project deploy start --source-dir force-app

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify the objects in Salesforce Setup"
echo "2. Assign permissions to users/profiles"
echo "3. Configure page layouts if needed"

# Cleanup
rm -rf "$TEMP_DIR"



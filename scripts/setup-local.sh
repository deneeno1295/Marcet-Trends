#!/bin/bash

# Local Development Setup Script for Insight Graph
# This script helps you get started quickly

set -e

echo "🚀 Insight Graph - Local Setup"
echo "================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js version 18+ is recommended (you have $(node -v))"
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local already exists. Skipping environment setup."
    echo "   If you want to reset it, delete .env.local and run this script again."
else
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: You need to fill in these required values in .env.local:"
    echo "   - DATABASE_URL (PostgreSQL connection string)"
    echo "   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from clerk.com)"
    echo "   - CLERK_SECRET_KEY (from clerk.com)"
    echo "   - OPENAI_API_KEY (from platform.openai.com)"
    echo ""
    read -p "Press Enter once you've updated .env.local, or Ctrl+C to exit..."
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npm run db:generate
echo "✅ Prisma client generated"
echo ""

# Check database connection
echo "🔍 Checking database connection..."
if npm run db:push -- --skip-generate &> /dev/null; then
    echo "✅ Database connected successfully"
    echo "✅ Schema pushed to database"
else
    echo "❌ Database connection failed."
    echo "   Please check your DATABASE_URL in .env.local"
    echo "   Make sure PostgreSQL is running and pgvector extension is installed."
    echo ""
    echo "   Quick setup options:"
    echo "   1. Supabase (recommended): https://supabase.com"
    echo "   2. Local PostgreSQL:"
    echo "      brew install postgresql@15 pgvector"
    echo "      brew services start postgresql@15"
    echo "      createdb insight_graph"
    exit 1
fi

# Seed database
echo ""
read -p "🌱 Would you like to seed the database with demo data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    npm run db:seed
    echo "✅ Database seeded with demo data"
    echo ""
    echo "   Demo credentials:"
    echo "   - Workspace: demo-workspace"
    echo "   - URL: http://localhost:3000/w/demo-workspace"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Sign up with Clerk"
echo "4. Explore the demo workspace"
echo ""
echo "Optional:"
echo "- Run Inngest dev server (in another terminal): npm run inngest:dev"
echo "- See TESTING.md for comprehensive testing guide"
echo ""



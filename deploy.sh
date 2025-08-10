#!/bin/bash

# Beaty.pro Dashboard Deployment Script
# This script helps deploy the dashboard to various platforms

set -e

echo "🚀 Beaty.pro Dashboard Deployment Script"
echo "========================================"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found!"
    echo "📝 Please copy env.example to .env.local and configure your environment variables"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. For Vercel: Run 'vercel --prod'"
echo "2. For Netlify: Run 'netlify deploy --prod --dir=.next'"
echo "3. For Docker: Run 'docker-compose up -d'"
echo "4. For manual: Run 'npm start' (after setting NODE_ENV=production)"
echo ""
echo "📋 Don't forget to:"
echo "- Update Supabase Site URL to your deployed domain"
echo "- Verify environment variables are set in your deployment platform"
echo "- Test authentication flow after deployment"
echo ""
echo "🎉 Ready for deployment!"

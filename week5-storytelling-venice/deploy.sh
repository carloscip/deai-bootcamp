#!/bin/bash

# This script helps you deploy to Vercel

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Ensure we have the latest code
git pull

# Build the project locally first to catch any errors
echo "Building project locally to verify..."
pnpm run build

# If the build was successful, proceed with deployment
if [ $? -eq 0 ]; then
    echo "Local build successful! Deploying to Vercel..."
    
    # Ask if this should be a production deployment
    read -p "Deploy to production? (y/N): " production
    
    if [[ $production =~ ^[Yy]$ ]]; then
        echo "Deploying to production..."
        vercel --prod
    else
        echo "Deploying preview..."
        vercel
    fi
else
    echo "Local build failed. Please fix the errors before deploying."
    exit 1
fi 
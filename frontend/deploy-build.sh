#!/bin/bash
# Creates static deploy folder for leads.libraro.in (no Node.js needed on server)
# Output: deploy/ folder - upload to Apache/PHP shared hosting

set -e
echo "Building Next.js static export..."
npm run build

echo "Creating deploy folder..."
DEPLOY_DIR="deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy static export output (HTML, CSS, JS - runs on any web server)
cp -r out/* "$DEPLOY_DIR/"

# Copy .htaccess for Apache (redirects, etc.)
if [ -f "public/.htaccess" ]; then
  cp public/.htaccess "$DEPLOY_DIR/"
fi

echo "Done! Deploy folder: $DEPLOY_DIR"
echo "Upload ALL contents of $DEPLOY_DIR to your web root (e.g. public_html for leads.libraro.in)"
echo "No Node.js required - works with Apache/PHP hosting"

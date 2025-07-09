#!/bin/bash

# Create a temporary directory for deployment
mkdir -p _deploy

# Copy the necessary files to the deployment directory
cp index.html _deploy/
cp homepage.html _deploy/
cp products.js _deploy/

# Navigate to the deployment directory
cd _deploy

# Initialize a new git repository
git init
git add .
git commit -m "Deploy to GitHub Pages"

# Push to GitHub Pages
git push --force "https://github.com/genwise/suruligreens.git" main:gh-pages

# Clean up
cd ..
rm -rf _deploy

echo "Deployment complete!" 
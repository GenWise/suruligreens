#!/bin/bash

# Ensure we're on the gh-pages branch
git checkout gh-pages

# Make sure we have the latest changes
git add .
git commit -m "Update GitHub Pages with product categories"

# Force push to gh-pages branch
git push -f origin gh-pages

echo "GitHub Pages updated!" 
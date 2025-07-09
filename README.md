# Suruli Greens

A website for Suruli Greens, a hydroponic microgreens and greens business.

## Features

- Modern, responsive design based on the brand's color palette
- Product showcase with "Add to Cart" functionality
- WhatsApp integration for order placement
- Ready for WhatsApp MCP integration with Claude AI

## Hosting on GitHub Pages with a Custom Domain

### Step 1: Set up GitHub Pages

1. Push this repository to GitHub
2. Go to the repository settings
3. Navigate to "Pages" in the sidebar
4. Under "Source", select "main" branch
5. Click "Save"

### Step 2: Set up a custom domain

1. Purchase a domain from a domain registrar (e.g., GoDaddy, Namecheap)
2. In your repository settings, under "Pages", enter your custom domain in the "Custom domain" field
3. Click "Save"
4. GitHub will create a file called `CNAME` in your repository with your domain name

### Step 3: Configure DNS records

Add the following DNS records with your domain registrar:

- Type: A, Host: @, Value: 185.199.108.153
- Type: A, Host: @, Value: 185.199.109.153
- Type: A, Host: @, Value: 185.199.110.153
- Type: A, Host: @, Value: 185.199.111.153
- Type: CNAME, Host: www, Value: yourusername.github.io (replace with your GitHub username)

### Step 4: Wait for DNS propagation

DNS changes can take up to 48 hours to propagate. Once propagation is complete, your site will be available at your custom domain.

## WhatsApp MCP Integration

This website is designed to work with a WhatsApp Multi-Channel Provider (MCP) server. The integration allows:

1. Direct order placement via WhatsApp
2. Automated message handling
3. Claude AI integration for order processing

To set up the MCP integration:

1. Update the WhatsApp number in the JavaScript code
2. Implement the `sendToMCPServer` function to connect to your MCP server
3. Configure your MCP server to process incoming orders using Claude

## Development

To modify this website:

1. Edit `homepage.html` to update content and design
2. Test locally by opening the file in your browser
3. Push changes to GitHub to update the live site 
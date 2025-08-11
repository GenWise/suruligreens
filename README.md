# Suruli Greens Order Processing System

This system integrates your Suruli Greens website with WhatsApp for order processing, payment handling, and delivery management.

## Features

1. **Order Processing**:
   - Store orders in Google Sheets when received via WhatsApp
   - Send automatic order confirmations with payment options
   - Track order status (Pending, Paid, Fulfilled)

2. **Payment Handling**:
   - Offer multiple payment options (WhatsApp Pay, QR Code, Phone call)
   - Process payment confirmations automatically
   - Store payment details in Google Sheets

3. **Delivery Management**:
   - Calculate next delivery date based on configured days (Tuesday/Friday)
   - Send delivery information to customers after payment
   - Display pickup information in website footer

4. **Dashboard**:
   - Mobile-friendly dashboard for monitoring orders
   - View orders by category
   - Update order status (mark as Paid or Fulfilled)

## Setup Instructions

### 1. Google Sheets Setup

1. Create a new Google Sheet with the following sheets:
   - **Orders**: To store order information
   - **Payments**: To store payment information
   - **Config**: To store configuration settings

2. In the Config sheet, add the following rows:
   - `Delivery Day 1` | `Tuesday`
   - `Delivery Day 2` | `Friday`

3. Deploy the Google Apps Script:
   - Open the Google Sheet
   - Go to Extensions > Apps Script
   - Copy the content of `order_processing.gs` into the script editor
   - Save and deploy as a web app (Execute as: Me, Who has access: Anyone)
   - Copy the web app URL for the next step

### 2. WhatsApp MCP Server Setup

1. Clone the WhatsApp MCP repository:
   ```
   git clone https://github.com/lharries/whatsapp-mcp.git
   cd whatsapp-mcp
   ```

2. Set up the WhatsApp bridge:
   ```
   cd whatsapp-bridge
   go run main.go
   ```

3. Scan the QR code with your WhatsApp business account to authenticate

4. Configure the webhook handler:
   ```
   cd ..
   npm install
   node webhook_handler.js
   ```

### 3. Website Configuration

1. Update the `config.js` file with your settings:
   ```javascript
   // Update these values
   WHATSAPP_NUMBER: '919840970514', // Your WhatsApp business number
   MCP_SERVER_URL: 'http://localhost:8000', // URL of your WhatsApp MCP server
   GOOGLE_SCRIPT_URL: 'https://script.google.com/...' // Your Google Apps Script web app URL
   ```

2. Add the WhatsApp MCP integration scripts to your website:
   - Make sure `config.js` and `whatsapp_mcp_integration.js` are included in your HTML files

## Usage

### Handling Orders

1. When a customer places an order on the website:
   - The order is sent to the WhatsApp MCP server
   - The customer receives a WhatsApp message with payment options
   - The order is stored in the Orders Google Sheet

2. When a customer sends a payment confirmation:
   - The WhatsApp MCP server processes the message
   - The payment is stored in the Payments Google Sheet
   - The customer receives a delivery confirmation message

### Managing Orders

1. Access the dashboard at `/dashboard.html`
2. View unfulfilled orders by category
3. Update order status as needed
4. Monitor total unfulfilled orders and revenue

## Customization

### Delivery Days

To change the delivery days:
1. Update the Config sheet in Google Sheets
2. The system will automatically calculate the next delivery date based on these settings

### Payment Options

To customize payment options:
1. Edit the `sendOrderConfirmation` function in `whatsapp_mcp_integration.js`
2. Update the QR code URL in `config.js` with your UPI ID

## Troubleshooting

### WhatsApp Connection Issues

If the WhatsApp connection fails:
1. Restart the WhatsApp bridge
2. Scan the QR code again to authenticate
3. Check that your WhatsApp business account is active

### Google Sheets Integration Issues

If orders are not being stored in Google Sheets:
1. Check the Google Apps Script deployment settings
2. Verify the web app URL in `config.js`
3. Check the browser console for any error messages

## Support

For any issues or questions, please contact:
- Email: hello@suruligreens.com
- Phone: +91 9840970514 
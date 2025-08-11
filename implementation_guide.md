# Suruli Greens Order Processing System - Implementation Guide

This guide provides step-by-step instructions for implementing the Suruli Greens order processing system using WhatsApp MCP integration.

## Overview of Files Created

1. **WhatsApp MCP Integration**:
   - `whatsapp_mcp_integration.js`: Handles communication with the WhatsApp MCP server
   - `webhook_handler.js`: Processes incoming webhook notifications from WhatsApp

2. **Google Sheets Integration**:
   - `order_processing.gs`: Google Apps Script for managing orders and payments in Google Sheets

3. **Dashboard**:
   - `dashboard.html`: Mobile-friendly dashboard for monitoring orders and sales

4. **Configuration**:
   - `config.js`: Updated with settings for WhatsApp MCP and Google Sheets integration

## Step 1: Set Up Google Sheets

1. **Create a new Google Sheet** with three sheets:
   - **Orders**: For storing order information
   - **Payments**: For storing payment details
   - **Config**: For configuration settings

2. **Set up the Config sheet**:
   - Add a row with `Delivery Day 1` in column A and `Tuesday` in column B
   - Add a row with `Delivery Day 2` in column A and `Friday` in column B

3. **Deploy the Google Apps Script**:
   - In the Google Sheet, go to Extensions > Apps Script
   - Create a new script file and paste the content of `order_processing.gs`
   - Save the script with the name "Order Processing"
   - Click Deploy > New deployment
   - Select type "Web app"
   - Set "Execute as" to "Me" and "Who has access" to "Anyone"
   - Click "Deploy" and authorize the script
   - Copy the Web app URL for later use
      (https://script.google.com/macros/s/AKfycbxRg0GjC2mCddmgFSvCEmbnsiaYWdOMc2QRLSMim_ADEJhDPEkg5_Nqpxox0Pk9KnaN8Q/exec)

## Step 2: Set Up WhatsApp MCP Server

1. **Install the WhatsApp MCP server**:
   - Follow the installation instructions at https://github.com/lharries/whatsapp-mcp
   - Clone the repository: `git clone https://github.com/lharries/whatsapp-mcp.git`
   - Navigate to the directory: `cd whatsapp-mcp` ('cd /Users/rajeshpanchanathan/Documents/genwise/projects/WMCP/whatsapp-mcp/whatsapp-bridge')

2. **Run the WhatsApp bridge**:
   - Go to the whatsapp-bridge directory: `cd whatsapp-bridge`
   - Run the Go application: `go run main.go`
   - Scan the QR code with your WhatsApp business account

3. **Set up the webhook handler**:
   - Copy `webhook_handler.js` to the whatsapp-mcp directory
   - Install dependencies: `npm install express body-parser cors node-fetch`
   - Run the webhook handler: `node webhook_handler.js`

## Step 3: Update Website Configuration

1. **Update config.js**:
   - Set `WHATSAPP_NUMBER` to your WhatsApp business number
   - Set `MCP_SERVER_URL` to the URL of your WhatsApp MCP server
   - Set `GOOGLE_SCRIPT_URL` to the URL of your Google Apps Script web app
   - Update `WHATSAPP_QR_URL` with your UPI ID for payments

2. **Add the integration files to your website**:
   - Copy `whatsapp_mcp_integration.js` to your website directory
   - Make sure `config.js` and `whatsapp_mcp_integration.js` are included in your HTML files

3. **Update the footer**:
   - The footer now includes the pickup information: "Pick up your order at the Edina Lobby, at 6pm on Tuesdays or Fridays"

## Step 4: Deploy the Dashboard

1. **Set up the dashboard**:
   - Copy `dashboard.html` to your website directory
   - Make sure it can access `config.js`

2. **Access the dashboard**:
   - Navigate to `/dashboard.html` in your browser
   - You should see the order summary, orders by category, and recent orders

## Step 5: Test the System

1. **Test order placement**:
   - Place an order on the website
   - Enter your phone number when prompted
   - Check that you receive a WhatsApp message with payment options

2. **Test payment processing**:
   - Send a payment confirmation message via WhatsApp
   - Check that the payment is recorded in the Payments sheet
   - Verify that you receive a delivery confirmation message

3. **Test the dashboard**:
   - Access the dashboard and check that orders are displayed correctly
   - Try updating the status of an order
   - Verify that the changes are reflected in the Google Sheet

## Troubleshooting

### WhatsApp MCP Connection Issues

- **Issue**: WhatsApp bridge fails to connect
  - **Solution**: Restart the bridge and scan the QR code again

- **Issue**: Webhook handler not receiving messages
  - **Solution**: Check that the MCP server is running and properly configured

### Google Sheets Integration Issues

- **Issue**: Orders not being stored in Google Sheets
  - **Solution**: Verify the Google Apps Script deployment settings and URL

- **Issue**: Error calculating delivery dates
  - **Solution**: Check the Config sheet for correct delivery day settings

### Website Integration Issues

- **Issue**: WhatsApp integration not working
  - **Solution**: Check browser console for errors and verify script inclusion

## Next Steps

1. **Set up a proper webhook endpoint**:
   - Deploy the webhook handler to a server with a public URL
   - Configure the WhatsApp MCP server to send webhooks to this URL

2. **Enhance the dashboard**:
   - Add authentication to protect the dashboard
   - Add more detailed reporting features

3. **Improve payment processing**:
   - Integrate with a payment gateway for online payments
   - Add automatic payment verification

4. **Set up automated reminders**:
   - Send reminders to customers before delivery days
   - Notify customers when their order is ready for pickup

By following these steps, you'll have a fully functional order processing system integrated with WhatsApp and Google Sheets. 
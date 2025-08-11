// Suruli Greens Configuration
// This file should be added to .gitignore to keep sensitive information out of version control

const config = {
    // Google Sheet Configuration
    SHEET_ID: '17OUHOS-Xhqmto_67ZbLMbWNnI7LgoDXswb3VwOvbkCU', // Corrected ID without the extra "E"
    API_KEY: '', // Only needed if sheet is not public
    
    // Contact Information
    WHATSAPP_NUMBER: '919840970514',
    CONTACT_EMAIL: 'hello@suruligreens.com',
    
    // Site Configuration
    SITE_URL: 'https://genwise.github.io/suruligreens/',
    
    // WhatsApp MCP Server Configuration
    MCP_SERVER_URL: 'http://localhost:8000', // URL of your WhatsApp MCP server
    
    // Payment Configuration
    WHATSAPP_QR_URL: 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=upi://pay?pa=YOUR_UPI_ID@ybl&pn=Suruli%20Greens&am={{amount}}&cu=INR&tn=Order%20{{orderId}}',
    
    // Google Apps Script Web App URL
    // After deploying your Google Apps Script, paste the web app URL here
    GOOGLE_SCRIPT_URL: 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjo6LbYkTpQuzonFNiaL-RyJVtr0-KDMlPxl4U066ZN_D6t42Yg1rBTHzxMyNwWlOLF_UQ1La29U-GD_SxAuC6nb2FCl6ETHIdKiMzoP7fsYaYB6237infYPxg2oKaq2uiasvDST8tJvy4bA0CI1vvmmkqkES3yQpEaWiZUNjW9Nuvht3v4eqtZljVpQmVdtPQWn3cAwfgF0fo4dyrii9HXJSUCQ3O_Nw-laHQtHHaQVlBUlN4PeijADLV4_TvVdEq_NQguHLYCNIou1kwGeOTmlSSjwzFNVjMYQJU-sgHY0gLwq2Y&lib=M2auU0JcZQAHBRmivLacEMWAnco0gBSxC',
    
    // Delivery Configuration
    DELIVERY_DAYS: ['Tuesday', 'Friday'],
    DELIVERY_TIME: '6:00 PM',
    DELIVERY_LOCATION: 'Edina Lobby'
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} 
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
    SITE_URL: 'https://genwise.github.io/suruligreens/'
};

// Export the configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
} 
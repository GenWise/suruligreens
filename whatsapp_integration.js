// Suruli Greens WhatsApp Integration
// This module handles integration with WhatsApp Business API

/**
 * WhatsApp Integration Module
 * This handles sending messages to customers via WhatsApp Business API
 */
const WhatsAppIntegration = (function() {
  // Configuration
  const config = {
    whatsappNumber: '', // Will be loaded from config.js
    apiUrl: 'https://graph.facebook.com/v17.0/',
    accessToken: '', // Your WhatsApp Business API token
    phoneNumberId: '', // Your WhatsApp Business Phone Number ID
    qrCodeUrl: 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=upi://pay?pa=YOUR_UPI_ID@ybl&pn=Suruli%20Greens&am={{amount}}&cu=INR&tn=Order%20{{orderId}}',
    googleScriptUrl: '' // Your Google Apps Script web app URL
  };

  // Initialize with config
  function init(userConfig) {
    if (userConfig) {
      config.whatsappNumber = userConfig.WHATSAPP_NUMBER || config.whatsappNumber;
      config.accessToken = userConfig.WHATSAPP_ACCESS_TOKEN || config.accessToken;
      config.phoneNumberId = userConfig.WHATSAPP_PHONE_ID || config.phoneNumberId;
      config.qrCodeUrl = userConfig.WHATSAPP_QR_URL || config.qrCodeUrl;
      config.googleScriptUrl = userConfig.GOOGLE_SCRIPT_URL || config.googleScriptUrl;
    }
  }

  /**
   * Send a WhatsApp message using the WhatsApp Business API
   * @param {string} to - Recipient phone number with country code
   * @param {string} message - Text message to send
   * @param {Object} options - Additional options like media, buttons, etc.
   * @return {Promise} - Promise that resolves with the API response
   */
  function sendMessage(to, message, options = {}) {
    // Ensure recipient number is in the correct format
    const recipient = formatPhoneNumber(to);
    
    // Prepare the message payload
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: {
        body: message
      }
    };
    
    // If using the Cloud API directly
    if (config.accessToken && config.phoneNumberId) {
      return sendViaCloudApi(payload, options);
    } 
    // Otherwise use a fallback method
    else {
      return sendViaFallback(to, message, options);
    }
  }
  
  /**
   * Send a message via the WhatsApp Cloud API
   * @param {Object} payload - Message payload
   * @param {Object} options - Additional options
   * @return {Promise} - Promise that resolves with the API response
   */
  function sendViaCloudApi(payload, options) {
    // Add media if provided
    if (options.mediaUrl) {
      payload.type = "image";
      delete payload.text;
      
      payload.image = {
        link: options.mediaUrl
      };
      
      if (options.caption) {
        payload.image.caption = options.caption;
      }
    }
    
    // Add buttons if provided
    if (options.buttons && options.buttons.length > 0) {
      payload.type = "interactive";
      delete payload.text;
      
      payload.interactive = {
        type: "button",
        body: {
          text: options.message || "Please select an option:"
        },
        action: {
          buttons: options.buttons.map((button, index) => ({
            type: "reply",
            reply: {
              id: `btn_${index}`,
              title: button.text
            }
          }))
        }
      };
    }
    
    // Add template if provided
    if (options.template) {
      payload.type = "template";
      delete payload.text;
      
      payload.template = {
        name: options.template,
        language: {
          code: "en_US"
        },
        components: []
      };
      
      if (options.templateParams) {
        const components = [{
          type: "body",
          parameters: options.templateParams.map(param => {
            if (typeof param === 'string') {
              return {
                type: "text",
                text: param
              };
            } else if (param.type === 'image') {
              return {
                type: "image",
                image: {
                  link: param.url
                }
              };
            }
            return {
              type: "text",
              text: String(param)
            };
          })
        }];
        
        payload.template.components = components;
      }
    }
    
    // Send the request to the WhatsApp Cloud API
    return fetch(`${config.apiUrl}${config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.accessToken}`
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      console.log('WhatsApp API Response:', data);
      return data;
    })
    .catch(error => {
      console.error('WhatsApp API Error:', error);
      throw error;
    });
  }
  
  /**
   * Send a message via fallback method (direct WhatsApp link)
   * @param {string} to - Recipient phone number
   * @param {string} message - Message to send
   * @param {Object} options - Additional options
   * @return {Promise} - Promise that resolves with a success object
   */
  function sendViaFallback(to, message, options) {
    // This is a fallback that just opens WhatsApp with the message
    // It doesn't actually send the message automatically
    console.log(`Would send to ${to}: ${message}`);
    console.log('Options:', options);
    
    // In a real implementation, this might use a different API or service
    return Promise.resolve({
      success: true,
      method: 'fallback',
      message: 'Message prepared for sending via fallback method'
    });
  }
  
  /**
   * Send an order confirmation with payment options
   * @param {string} to - Customer phone number
   * @param {Object} orderDetails - Order details including orderId, amount, items
   * @return {Promise} - Promise that resolves when message is sent
   */
  function sendOrderConfirmation(to, orderDetails) {
    // Store order in Google Sheets
    storeOrder(to, orderDetails)
      .then(response => {
        console.log('Order stored:', response);
        
        // Get the order ID from the response or use a generated one
        const orderId = response.orderId || `ORD${Date.now().toString().slice(-6)}`;
        
        // Create QR code URL with order amount
        const qrCodeUrl = config.qrCodeUrl
          .replace('{{amount}}', orderDetails.totalAmount)
          .replace('{{orderId}}', orderId);
        
        // Send confirmation message with payment options
        return sendMessage(to, 
          `Thank you for your order (${orderId}).\n\nPlease select a payment option:`, 
          {
            buttons: [
              { text: "Pay via WhatsApp" },
              { text: "Pay via QR Code" },
              { text: "Call for Other Options" }
            ]
          }
        ).then(() => {
          // Listen for button response
          // In a real implementation, this would be handled by a webhook
          console.log('Waiting for customer to select payment option...');
          
          // For demo purposes, we'll simulate sending the QR code after a delay
          setTimeout(() => {
            sendMessage(to, "Here's your payment QR code:", {
              mediaUrl: qrCodeUrl,
              caption: `Scan to pay ₹${orderDetails.totalAmount} for order ${orderId}`
            });
          }, 1000);
        });
      })
      .catch(error => {
        console.error('Error processing order:', error);
        return sendMessage(to, "Sorry, there was an error processing your order. Please try again or contact us directly.");
      });
  }
  
  /**
   * Send payment confirmation and delivery information
   * @param {string} to - Customer phone number
   * @param {Object} paymentDetails - Payment details including orderId, amount
   * @return {Promise} - Promise that resolves when message is sent
   */
  function sendPaymentConfirmation(to, paymentDetails) {
    // Store payment in Google Sheets
    storePayment(to, paymentDetails)
      .then(response => {
        console.log('Payment stored:', response);
        
        // Calculate next delivery date
        const deliveryDate = getNextDeliveryDate();
        const formattedDate = formatDate(deliveryDate);
        
        // Send confirmation message
        return sendMessage(to, 
          `Payment Received, Thank you!\n\nYour order will be ready for pickup at Edina Lobby on ${formattedDate}.`
        );
      })
      .catch(error => {
        console.error('Error processing payment:', error);
        return sendMessage(to, "We received your payment, but there was an issue updating our records. Don't worry, we've noted your order.");
      });
  }
  
  /**
   * Store order in Google Sheets via the Google Apps Script
   * @param {string} customerId - Customer phone number
   * @param {Object} orderDetails - Order details
   * @return {Promise} - Promise that resolves with the response
   */
  function storeOrder(customerId, orderDetails) {
    // Prepare the data to send to Google Apps Script
    const data = {
      type: "new_order",
      customerId: customerId,
      items: orderDetails.items,
      totalAmount: orderDetails.totalAmount
    };
    
    // Send to Google Apps Script
    return fetch(config.googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .catch(error => {
      console.error('Error storing order:', error);
      throw error;
    });
  }
  
  /**
   * Store payment in Google Sheets via the Google Apps Script
   * @param {string} customerId - Customer phone number
   * @param {Object} paymentDetails - Payment details
   * @return {Promise} - Promise that resolves with the response
   */
  function storePayment(customerId, paymentDetails) {
    // Prepare the data to send to Google Apps Script
    const data = {
      type: "payment_confirmation",
      customerId: customerId,
      orderId: paymentDetails.orderId,
      amount: paymentDetails.amount,
      message: paymentDetails.message || "Payment received"
    };
    
    // Send to Google Apps Script
    return fetch(config.googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .catch(error => {
      console.error('Error storing payment:', error);
      throw error;
    });
  }
  
  /**
   * Format a phone number to ensure it has the country code
   * @param {string} phoneNumber - Phone number to format
   * @return {string} - Formatted phone number
   */
  function formatPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let digits = phoneNumber.replace(/\D/g, '');
    
    // Ensure it has the country code (91 for India)
    if (digits.length === 10) {
      digits = '91' + digits;
    } else if (digits.startsWith('0')) {
      digits = '91' + digits.substring(1);
    } else if (!digits.startsWith('91')) {
      digits = '91' + digits;
    }
    
    return digits;
  }
  
  /**
   * Calculate the next delivery date (Tuesday or Friday)
   * @return {Date} - Next delivery date
   */
  function getNextDeliveryDate() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Days until next Tuesday (day 2)
    const daysUntilTuesday = (9 - dayOfWeek) % 7;
    
    // Days until next Friday (day 5)
    const daysUntilFriday = (12 - dayOfWeek) % 7;
    
    // Use the closest upcoming day
    const daysToAdd = Math.min(
      daysUntilTuesday === 0 ? 7 : daysUntilTuesday,
      daysUntilFriday === 0 ? 7 : daysUntilFriday
    );
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    
    return nextDate;
  }
  
  /**
   * Format a date as a readable string
   * @param {Date} date - Date to format
   * @return {string} - Formatted date string
   */
  function formatDate(date) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Public API
  return {
    init,
    sendMessage,
    sendOrderConfirmation,
    sendPaymentConfirmation,
    formatPhoneNumber
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WhatsAppIntegration;
} 
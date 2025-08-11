// Suruli Greens WhatsApp MCP Integration
// This module handles integration with WhatsApp using the MCP server

/**
 * WhatsApp MCP Integration Module
 * This handles sending messages to customers via WhatsApp MCP server
 */
const WhatsAppMCPIntegration = (function() {
  // Configuration
  const config = {
    whatsappNumber: '', // Will be loaded from config.js
    mcpServerUrl: 'http://localhost:8000', // Default MCP server URL
    googleScriptUrl: '', // Your Google Apps Script web app URL
    qrCodeUrl: 'https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=upi://pay?pa=YOUR_UPI_ID@ybl&pn=Suruli%20Greens&am={{amount}}&cu=INR&tn=Order%20{{orderId}}'
  };

  // Initialize with config
  function init(userConfig) {
    if (userConfig) {
      config.whatsappNumber = userConfig.WHATSAPP_NUMBER || config.whatsappNumber;
      config.mcpServerUrl = userConfig.MCP_SERVER_URL || config.mcpServerUrl;
      config.googleScriptUrl = userConfig.GOOGLE_SCRIPT_URL || config.googleScriptUrl;
      config.qrCodeUrl = userConfig.WHATSAPP_QR_URL || config.qrCodeUrl;
    }
    
    console.log('WhatsApp MCP Integration initialized with config:', config);
  }

  /**
   * Send a WhatsApp message using the MCP server
   * @param {string} to - Recipient phone number with country code
   * @param {string} message - Text message to send
   * @return {Promise} - Promise that resolves with the MCP response
   */
  function sendMessage(to, message) {
    // Ensure recipient number is in the correct format
    const recipient = formatPhoneNumber(to);
    
    console.log(`Sending message to ${recipient}: ${message}`);
    
    // Call the MCP server to send the message
    return fetch(`${config.mcpServerUrl}/mcp/whatsapp/send_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: recipient,
        message: message
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log('MCP Response:', data);
      return data;
    })
    .catch(error => {
      console.error('Error sending message via MCP:', error);
      throw error;
    });
  }
  
  /**
   * Send an image via WhatsApp using the MCP server
   * @param {string} to - Recipient phone number with country code
   * @param {string} imageUrl - URL of the image to send
   * @param {string} caption - Optional caption for the image
   * @return {Promise} - Promise that resolves with the MCP response
   */
  function sendImage(to, imageUrl, caption = '') {
    // Ensure recipient number is in the correct format
    const recipient = formatPhoneNumber(to);
    
    console.log(`Sending image to ${recipient}: ${imageUrl}`);
    
    // Download the image first (if it's a URL)
    return fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        // Create a FormData object to send the image
        const formData = new FormData();
        formData.append('recipient', recipient);
        formData.append('caption', caption);
        formData.append('file', blob, 'image.jpg');
        
        // Call the MCP server to send the image
        return fetch(`${config.mcpServerUrl}/mcp/whatsapp/send_image`, {
          method: 'POST',
          body: formData
        });
      })
      .then(response => response.json())
      .then(data => {
        console.log('MCP Response:', data);
        return data;
      })
      .catch(error => {
        console.error('Error sending image via MCP:', error);
        throw error;
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
    return storeOrder(to, orderDetails)
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
          `Thank you for your order (${orderId}).\n\nPlease select a payment option:\n` +
          `1. Pay via WhatsApp\n` +
          `2. Pay via QR Code\n` +
          `3. Call us to discuss other payment options\n\n` +
          `Reply with the number of your preferred option.`
        ).then(() => {
          // In a real implementation, we would wait for the customer's response
          // and then send the appropriate payment option
          
          // For demo purposes, we'll simulate sending the QR code after a delay
          setTimeout(() => {
            // Generate QR code and send it
            sendImage(to, qrCodeUrl, `Scan to pay ₹${orderDetails.totalAmount} for order ${orderId}`);
          }, 1000);
          
          return { success: true, orderId: orderId };
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
    return storePayment(to, paymentDetails)
      .then(response => {
        console.log('Payment stored:', response);
        
        // Prefer asking Apps Script for the next delivery date and config
        return fetch(`${config.googleScriptUrl}?action=config`)
          .then(r => r.json())
          .catch(() => ({ success: false }))
          .then(cfgRes => {
            return fetch(`${config.googleScriptUrl}?action=next_delivery_date`)
              .then(r => r.json())
              .catch(() => ({ success: false }))
              .then(dateRes => ({ cfgRes, dateRes }));
          })
          .then(({ cfgRes, dateRes }) => {
            let deliveryDate = dateRes && dateRes.success ? new Date(dateRes.nextDeliveryDate) : getNextDeliveryDate();
            const formattedDate = formatDate(deliveryDate);
            const loc = (cfgRes && cfgRes.success && cfgRes.config && cfgRes.config.deliveryLocation) ? cfgRes.config.deliveryLocation : 'Edina Lobby';
            
            // Send confirmation message
            return sendMessage(to, 
              `Payment Received, Thank you!\n\nYour order will be ready for pickup at ${loc} on ${formattedDate}.`
            );
          });
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
  
  /**
   * Listen for incoming messages (to be implemented with webhooks)
   * This would connect to the MCP server's webhook system
   */
  function setupMessageListener() {
    console.log('Setting up message listener (webhook implementation required)');
    // In a real implementation, this would set up a webhook endpoint
    // to receive notifications from the MCP server
  }
  
  /**
   * Process incoming messages for payment confirmations
   * @param {Object} message - The received message
   * @return {Object} - Extracted payment information
   */
  function processIncomingMessage(message) {
    // Simple implementation - in reality, would use more sophisticated NLP
    const content = message.content.toLowerCase();
    
    // Check if it's a payment confirmation
    if (content.includes("payment") || content.includes("paid") || 
        content.includes("upi") || content.includes("screenshot")) {
      
      // Try to extract order ID if present
      let orderId = null;
      const orderMatch = content.match(/ord\d{6}/i);
      if (orderMatch) {
        orderId = orderMatch[0].toUpperCase();
      }
      
      // Try to extract amount if present
      let amount = null;
      const amountMatch = content.match(/(\d+(\.\d{1,2})?)/);
      if (amountMatch) {
        amount = parseFloat(amountMatch[0]);
      }
      
      // Determine payment method
      let paymentMethod = "Unknown";
      if (content.includes("upi")) {
        paymentMethod = "UPI";
      } else if (content.includes("whatsapp")) {
        paymentMethod = "WhatsApp Pay";
      } else if (content.includes("qr") || content.includes("scan")) {
        paymentMethod = "QR Code";
      } else if (content.includes("screenshot")) {
        paymentMethod = "Screenshot Verification";
      }
      
      return {
        isPayment: true,
        orderId: orderId,
        amount: amount,
        method: paymentMethod,
        sender: message.sender
      };
    }
    
    // Check if it's a response to payment options
    if (content === "1" || content.includes("whatsapp pay")) {
      return {
        isPaymentOption: true,
        option: "whatsapp"
      };
    } else if (content === "2" || content.includes("qr")) {
      return {
        isPaymentOption: true,
        option: "qr"
      };
    } else if (content === "3" || content.includes("call")) {
      return {
        isPaymentOption: true,
        option: "call"
      };
    }
    
    return { isPayment: false, isPaymentOption: false };
  }
  
  // Public API
  return {
    init,
    sendMessage,
    sendImage,
    sendOrderConfirmation,
    sendPaymentConfirmation,
    formatPhoneNumber,
    setupMessageListener,
    processIncomingMessage
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WhatsAppMCPIntegration;
} 
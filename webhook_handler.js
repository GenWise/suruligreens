// Suruli Greens WhatsApp MCP Webhook Handler
// This script handles incoming webhook notifications from the WhatsApp MCP server

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');

// Import configuration
const config = require('./config');

// Import WhatsApp MCP Integration
const WhatsAppMCPIntegration = require('./whatsapp_mcp_integration');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize WhatsApp MCP Integration
WhatsAppMCPIntegration.init(config);

// Webhook endpoint for WhatsApp MCP server
app.post('/webhook/whatsapp', async (req, res) => {
    try {
        console.log('Received webhook from WhatsApp MCP server:', req.body);
        
        // Extract message data
        const { message, sender, timestamp, chat_jid } = req.body;
        
        if (!message || !sender) {
            return res.status(400).json({ success: false, error: 'Invalid webhook data' });
        }
        
        // Process the message
        const messageInfo = WhatsAppMCPIntegration.processIncomingMessage({
            content: message,
            sender: sender,
            timestamp: timestamp || new Date().toISOString(),
            chat_jid: chat_jid
        });
        
        // Check if it's an order placed message
        if (messageInfo.isOrder) {
            console.log('New order detected from WhatsApp:', messageInfo);
            try {
                const orderDetails = {
                    items: (messageInfo.items || []).map(it => ({
                        name: it.name,
                        price: it.price,
                        quantity: it.quantity,
                        category: 'Uncategorized'
                    })),
                    totalAmount: messageInfo.totalAmount || 0
                };
                await WhatsAppMCPIntegration.sendOrderConfirmation(sender, orderDetails);
                return res.json({ success: true, message: 'Order processed successfully' });
            } catch (error) {
                console.error('Error processing new order:', error);
                return res.status(500).json({ success: false, error: 'Error processing new order' });
            }
        }

        // Check if it's a payment confirmation
        if (messageInfo.isPayment) {
            console.log('Payment confirmation detected:', messageInfo);
            
            // Store payment in Google Sheets
            const paymentDetails = {
                orderId: messageInfo.orderId,
                amount: messageInfo.amount,
                method: messageInfo.method,
                message: message
            };
            
            try {
                // Send payment confirmation
                await WhatsAppMCPIntegration.sendPaymentConfirmation(sender, paymentDetails);
                
                return res.json({
                    success: true,
                    message: 'Payment confirmation processed successfully'
                });
            } catch (error) {
                console.error('Error processing payment confirmation:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Error processing payment confirmation'
                });
            }
        }
        
        // Check if it's a response to payment options
        if (messageInfo.isPaymentOption) {
            console.log('Payment option selected:', messageInfo.option);
            
            // Handle different payment options
            switch (messageInfo.option) {
                case 'whatsapp':
                    // Send instructions for WhatsApp Pay
                    await WhatsAppMCPIntegration.sendMessage(sender, 
                        "To pay via WhatsApp, please follow these steps:\n\n" +
                        "1. Tap the payment icon in your WhatsApp chat\n" +
                        "2. Enter the amount\n" +
                        "3. Complete the payment\n\n" +
                        "Once completed, please send us a screenshot or confirmation message."
                    );
                    break;
                    
                case 'qr':
                    // Send QR code for payment
                    // In a real implementation, this would generate a QR code with the correct amount
                    const qrCodeUrl = config.WHATSAPP_QR_URL
                        .replace('{{amount}}', '500') // This would be the actual order amount
                        .replace('{{orderId}}', 'ORD123456'); // This would be the actual order ID
                    
                    await WhatsAppMCPIntegration.sendImage(sender, qrCodeUrl, 
                        "Scan this QR code to pay. Once completed, please send us a confirmation message."
                    );
                    break;
                    
                case 'call':
                    // Send message with phone number to call
                    await WhatsAppMCPIntegration.sendMessage(sender, 
                        "Please call us at +91 9840970514 to discuss payment options. We're available from 9 AM to 6 PM."
                    );
                    break;
                    
                default:
                    // Send generic response
                    await WhatsAppMCPIntegration.sendMessage(sender, 
                        "Thank you for your message. We'll get back to you shortly."
                    );
            }
            
            return res.json({
                success: true,
                message: 'Payment option processed successfully'
            });
        }
        
        // Default response for other messages
        await WhatsAppMCPIntegration.sendMessage(sender, 
            "Thank you for your message. Our team will get back to you shortly."
        );
        
        return res.json({
            success: true,
            message: 'Webhook processed successfully'
        });
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        return res.status(500).json({
            success: false,
            error: 'Error processing webhook'
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`WhatsApp MCP webhook handler running on port ${PORT}`);
});

// Export the app for testing
module.exports = app; 
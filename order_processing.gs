// Suruli Greens Order Processing Script
// This script handles order processing, Google Sheets integration, and WhatsApp messaging

/**
 * Global variables for sheet names and delivery days
 */
const ORDERS_SHEET_NAME = "Orders";
const PAYMENTS_SHEET_NAME = "Payments";
const DELIVERY_DAYS = {
  tuesday: 2, // Tuesday is day 2 (0 = Sunday, 1 = Monday, etc.)
  friday: 5   // Friday is day 5
};

/**
 * Creates necessary sheets if they don't exist
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Orders sheet if it doesn't exist
  let ordersSheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  if (!ordersSheet) {
    ordersSheet = ss.insertSheet(ORDERS_SHEET_NAME);
    ordersSheet.appendRow([
      "Order ID", 
      "Customer ID", 
      "Order Date", 
      "Items", 
      "Total Amount", 
      "Planned Delivery Date",
      "Status"
    ]);
    
    // Format header row
    ordersSheet.getRange(1, 1, 1, 7).setFontWeight("bold");
    ordersSheet.setFrozenRows(1);
  }
  
  // Create Payments sheet if it doesn't exist
  let paymentsSheet = ss.getSheetByName(PAYMENTS_SHEET_NAME);
  if (!paymentsSheet) {
    paymentsSheet = ss.insertSheet(PAYMENTS_SHEET_NAME);
    paymentsSheet.appendRow([
      "Payment ID", 
      "Order ID", 
      "Customer ID", 
      "Payment Date", 
      "Amount", 
      "Payment Method",
      "Status"
    ]);
    
    // Format header row
    paymentsSheet.getRange(1, 1, 1, 7).setFontWeight("bold");
    paymentsSheet.setFrozenRows(1);
  }
  
  // Create Config sheet if it doesn't exist
  let configSheet = ss.getSheetByName("Config");
  if (!configSheet) {
    configSheet = ss.insertSheet("Config");
    configSheet.appendRow(["Setting", "Value"]);
    configSheet.appendRow(["Delivery Day 1", "Tuesday"]);
    configSheet.appendRow(["Delivery Day 2", "Friday"]);
    
    // Format header row
    configSheet.getRange(1, 1, 1, 2).setFontWeight("bold");
    configSheet.setFrozenRows(1);
  }
}

/**
 * Processes a new order from WhatsApp
 * @param {string} customerId - Customer's mobile number
 * @param {Array} items - Array of order items
 * @param {number} totalAmount - Total order amount
 * @return {string} orderId - The generated order ID
 */
function processNewOrder(customerId, items, totalAmount) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  
  // Generate order ID
  const orderId = "ORD" + new Date().getTime().toString().slice(-6);
  
  // Calculate next delivery date
  const plannedDeliveryDate = getNextDeliveryDate();
  
  // Format items as JSON string
  const itemsJson = JSON.stringify(items);
  
  // Add order to sheet
  ordersSheet.appendRow([
    orderId,
    customerId,
    new Date(),
    itemsJson,
    totalAmount,
    plannedDeliveryDate,
    "Pending"
  ]);
  
  return orderId;
}

/**
 * Calculate the next delivery date based on the configured delivery days
 * @return {Date} The next delivery date
 */
function getNextDeliveryDate() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName("Config");
  
  // Get delivery days from config
  const configData = configSheet.getDataRange().getValues();
  let deliveryDays = [];
  
  for (let i = 1; i < configData.length; i++) {
    if (configData[i][0].includes("Delivery Day")) {
      const dayName = configData[i][1].toLowerCase();
      switch (dayName) {
        case "sunday": deliveryDays.push(0); break;
        case "monday": deliveryDays.push(1); break;
        case "tuesday": deliveryDays.push(2); break;
        case "wednesday": deliveryDays.push(3); break;
        case "thursday": deliveryDays.push(4); break;
        case "friday": deliveryDays.push(5); break;
        case "saturday": deliveryDays.push(6); break;
      }
    }
  }
  
  // If no delivery days configured, use defaults
  if (deliveryDays.length === 0) {
    deliveryDays = [DELIVERY_DAYS.tuesday, DELIVERY_DAYS.friday];
  }
  
  // Sort delivery days
  deliveryDays.sort((a, b) => a - b);
  
  // Find next delivery date
  const today = new Date();
  const todayDay = today.getDay();
  
  // Find the next day in the week that is a delivery day
  let nextDeliveryDay = null;
  for (const day of deliveryDays) {
    if (day > todayDay) {
      nextDeliveryDay = day;
      break;
    }
  }
  
  // If no delivery day found later this week, use the first delivery day next week
  if (nextDeliveryDay === null) {
    nextDeliveryDay = deliveryDays[0];
    // Add days until we reach next week's delivery day
    const daysToAdd = 7 - todayDay + nextDeliveryDay;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  } else {
    // Add days until we reach this week's next delivery day
    const daysToAdd = nextDeliveryDay - todayDay;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate;
  }
}

/**
 * Reads configuration values from the Config sheet
 * @return {Object} Config values: deliveryDays[], deliveryTime, deliveryLocation
 */
function getConfigValues() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName("Config");
  const result = {
    deliveryDays: [],
    deliveryTime: "6:00 PM",
    deliveryLocation: "Edina Lobby"
  };
  if (!configSheet) {
    // Fallback to defaults used elsewhere
    result.deliveryDays = [DELIVERY_DAYS.tuesday, DELIVERY_DAYS.friday];
    return normalizeConfig(result);
  }
  const data = configSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const key = String(data[i][0] || '').toLowerCase();
    const value = String(data[i][1] || '').trim();
    if (!key) continue;
    if (key.includes('delivery day')) {
      const day = value.toLowerCase();
      switch (day) {
        case 'sunday': result.deliveryDays.push(0); break;
        case 'monday': result.deliveryDays.push(1); break;
        case 'tuesday': result.deliveryDays.push(2); break;
        case 'wednesday': result.deliveryDays.push(3); break;
        case 'thursday': result.deliveryDays.push(4); break;
        case 'friday': result.deliveryDays.push(5); break;
        case 'saturday': result.deliveryDays.push(6); break;
        default: break;
      }
    } else if (key.includes('delivery time')) {
      result.deliveryTime = value || result.deliveryTime;
    } else if (key.includes('pickup location') || key.includes('delivery location')) {
      result.deliveryLocation = value || result.deliveryLocation;
    }
  }
  if (result.deliveryDays.length === 0) {
    result.deliveryDays = [DELIVERY_DAYS.tuesday, DELIVERY_DAYS.friday];
  }
  return normalizeConfig(result);
}

/**
 * Converts numeric deliveryDays to human-readable names as well
 */
function normalizeConfig(cfg) {
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const names = cfg.deliveryDays.map(function(d){ return dayNames[d]; });
  return {
    deliveryDays: cfg.deliveryDays,
    deliveryDayNames: names,
    deliveryTime: cfg.deliveryTime,
    deliveryLocation: cfg.deliveryLocation
  };
}

/**
 * Processes a payment for an order
 * @param {string} orderId - The order ID
 * @param {string} customerId - Customer's mobile number
 * @param {number} amount - Payment amount
 * @param {string} paymentMethod - Payment method (WhatsApp, QR Code, etc.)
 * @return {boolean} success - Whether the payment was processed successfully
 */
function processPayment(orderId, customerId, amount, paymentMethod) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const paymentsSheet = ss.getSheetByName(PAYMENTS_SHEET_NAME);
  const ordersSheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  
  // Generate payment ID
  const paymentId = "PAY" + new Date().getTime().toString().slice(-6);
  
  // Add payment to sheet
  paymentsSheet.appendRow([
    paymentId,
    orderId,
    customerId,
    new Date(),
    amount,
    paymentMethod,
    "Completed"
  ]);
  
  // Update order status
  const orderData = ordersSheet.getDataRange().getValues();
  for (let i = 1; i < orderData.length; i++) {
    if (orderData[i][0] === orderId) {
      ordersSheet.getRange(i + 1, 7).setValue("Paid");
      break;
    }
  }
  
  return true;
}

/**
 * Parses a payment confirmation message
 * @param {string} message - The message to parse
 * @return {Object} paymentInfo - Extracted payment information
 */
function parsePaymentMessage(message) {
  // Simple implementation - in reality, would use more sophisticated NLP
  const lowerMsg = message.toLowerCase();
  
  // Check if it's a payment confirmation
  if (lowerMsg.includes("payment") || lowerMsg.includes("paid") || 
      lowerMsg.includes("upi") || lowerMsg.includes("screenshot")) {
    
    // Try to extract order ID if present
    let orderId = null;
    const orderMatch = lowerMsg.match(/ord\d{6}/i);
    if (orderMatch) {
      orderId = orderMatch[0].toUpperCase();
    }
    
    // Try to extract amount if present
    let amount = null;
    const amountMatch = lowerMsg.match(/(\d+(\.\d{1,2})?)/);
    if (amountMatch) {
      amount = parseFloat(amountMatch[0]);
    }
    
    // Determine payment method
    let paymentMethod = "Unknown";
    if (lowerMsg.includes("upi")) {
      paymentMethod = "UPI";
    } else if (lowerMsg.includes("whatsapp")) {
      paymentMethod = "WhatsApp Pay";
    } else if (lowerMsg.includes("qr") || lowerMsg.includes("scan")) {
      paymentMethod = "QR Code";
    } else if (lowerMsg.includes("screenshot")) {
      paymentMethod = "Screenshot Verification";
    }
    
    return {
      isPayment: true,
      orderId: orderId,
      amount: amount,
      method: paymentMethod
    };
  }
  
  return { isPayment: false };
}

/**
 * Gets dashboard data for unfulfilled orders
 * @return {Object} dashboardData - Data for the dashboard
 */
function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  const orderData = ordersSheet.getDataRange().getValues();
  
  // Skip header row
  const orders = [];
  for (let i = 1; i < orderData.length; i++) {
    if (orderData[i][6] !== "Fulfilled") {
      orders.push({
        orderId: orderData[i][0],
        customerId: orderData[i][1],
        orderDate: orderData[i][2],
        items: JSON.parse(orderData[i][3]),
        totalAmount: orderData[i][4],
        deliveryDate: orderData[i][5],
        status: orderData[i][6]
      });
    }
  }
  
  // Aggregate by category
  const categoryCounts = {};
  const itemCounts = {};
  
  orders.forEach(order => {
    const items = order.items;
    items.forEach(item => {
      // Assuming item has category and name properties
      const category = item.category || "Uncategorized";
      const name = item.name;
      
      // Count by category
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category] += item.quantity;
      
      // Count by item
      const itemKey = `${category}:${name}`;
      if (!itemCounts[itemKey]) {
        itemCounts[itemKey] = 0;
      }
      itemCounts[itemKey] += item.quantity;
    });
  });
  
  return {
    totalUnfulfilledOrders: orders.length,
    categoryCounts: categoryCounts,
    itemCounts: itemCounts,
    orders: orders
  };
}

/**
 * Updates the fulfillment status of an order
 * @param {string} orderId - The order ID
 * @param {string} status - New status (Pending, Paid, Fulfilled)
 * @return {boolean} success - Whether the update was successful
 */
function updateOrderStatus(orderId, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  const orderData = ordersSheet.getDataRange().getValues();
  
  for (let i = 1; i < orderData.length; i++) {
    if (orderData[i][0] === orderId) {
      ordersSheet.getRange(i + 1, 7).setValue(status);
      return true;
    }
  }
  
  return false;
}

/**
 * Web app endpoint to receive WhatsApp webhook notifications
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Process based on notification type
    if (data.type === "new_order") {
      const orderId = processNewOrder(data.customerId, data.items, data.totalAmount);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        orderId: orderId
      })).setMimeType(ContentService.MimeType.JSON);
    } 
    else if (data.type === "payment_confirmation") {
      const paymentInfo = parsePaymentMessage(data.message);
      if (paymentInfo.isPayment) {
        const success = processPayment(
          data.orderId, 
          data.customerId, 
          data.amount, 
          paymentInfo.method
        );
        return ContentService.createTextOutput(JSON.stringify({
          success: success
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Unknown request type"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Web app endpoint to get dashboard data
 */
function doGet(e) {
  try {
    if (e.parameter.action === "dashboard") {
      const dashboardData = getDashboardData();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: dashboardData
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (e.parameter.action === "config") {
      const cfg = getConfigValues();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        config: cfg
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (e.parameter.action === "next_delivery_date") {
      const nextDate = getNextDeliveryDate();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        nextDeliveryDate: nextDate
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (e.parameter.action === "orders_by_phone") {
      const phone = (e.parameter.phone || '').trim();
      if (!phone) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "Missing phone"
        })).setMimeType(ContentService.MimeType.JSON);
      }
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const ordersSheet = ss.getSheetByName(ORDERS_SHEET_NAME);
      const data = ordersSheet.getDataRange().getValues();
      const orders = [];
      for (let i = 1; i < data.length; i++) {
        if ((String(data[i][1] || '')).includes(phone)) {
          orders.push({
            orderId: data[i][0],
            customerId: data[i][1],
            orderDate: data[i][2],
            items: JSON.parse(data[i][3] || '[]'),
            totalAmount: data[i][4],
            deliveryDate: data[i][5],
            status: data[i][6]
          });
        }
      }
      // Sort newest first
      orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        orders: orders
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Initialize the script
 */
function initialize() {
  setupSheets();
} 
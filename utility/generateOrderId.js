const Order = require('../models/order');

/**
 * Generates a unique 6-digit order ID
 * @returns {Promise<string>} A unique 6-digit order ID
 */
async function generateOrderId() {
    let orderId;
    let isUnique = false;
    
    while (!isUnique) {
        // Generate a 6-digit random number
        orderId = Math.floor(100000 + Math.random() * 900000).toString();
        
        
        const existingOrder = await Order.findOne({ orderId });
        if (!existingOrder) {
            isUnique = true;
        }
    }
    
    return orderId;
}

module.exports = generateOrderId;

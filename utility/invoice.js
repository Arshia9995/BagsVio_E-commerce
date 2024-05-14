const easyinvoice = require('easyinvoice');
const fs = require("fs");
const path = require("path");
const util = require("util");
const writeFileAsync = util.promisify(fs.writeFile);

module.exports = {
  order: async (order) => {
   
  var data = {
          
            "customize": {
                
            },

            "images": {
               

            },
            "sender": {
                "company": "BagsVio",
                "address": "VATAKARA",
                "zip": "673001",
                "city": "Calicut",
                "country": "Kerala"
            },
            "client": {
               
            },
            "information": {
                "number": order._id,
                "date": order.orderDate,
                "due-date": order.orderDate
            },
            "products": order.products.map((product) => ({
                "quantity": product.quantity,
                "description": product.productId.ProductName, 
                "tax-rate": 0,
                "price":  product.price
            })),

            "bottom-notice": "Thank You For Your Purchase",
            "settings": {
                "currency": "USD",
                "tax-notation": "vat",
                "currency": "INR",
                "tax-notation": "GST",
                "margin-top": 50,
                "margin-right": 50,
                "margin-left": 50,
                "margin-bottom": 25
            },

       
        "translate": {
           
        }
    }

  

      return new Promise(async (resolve, reject) => {
        try {
            const result = await easyinvoice.createInvoice(data);


            const filePath = path.join(__dirname, '..', 'public', 'pdf', `${order._id}.pdf`);
            await writeFileAsync(filePath, result.pdf, 'base64');

            resolve(filePath);
 } catch (error) {
            console.log(error)
            reject(error);
        }
    });
    }
};
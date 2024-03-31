const easyinvoice = require('easyinvoice');
const fs = require("fs");
const path = require("path");
const util = require("util");
const writeFileAsync = util.promisify(fs.writeFile);

module.exports = {
  order: async (order) => {
    // console.log(order, "utitlity");
  var data = {
            // Customize enables you to provide your own templates
            // Please review the documentation for instructions and examples
            "customize": {
                //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html 
            },

            "images": {
                // "background": "https://public.easyinvoice.cloud/pdf/sample-background.pdf"
                // "logo": fs.readFileSync(path.join(__dirname, '..', 'public', 'images', 'screenshot--272-removebgpreview-1@2x.png'), 'base64'),
                // "background": fs.readFileSync(path.join(__dirname, '..', 'public', 'assets', 'background', 'your_background.png'), 'base64')
                // "background": "https://public.easyinvoice.cloud/pdf/sample-background.pdf"

            },
            "sender": {
                "company": "BagsVio",
                "address": "VATAKARA",
                "zip": "673001",
                "city": "Calicut",
                "country": "Kerala"
            },
            "client": {
                // "company": order.ShippedAddress.Name,
                // "address": order.ShippedAddress.Address,
                // "zip":order.ShippedAddress.Pincode ,
                // "zip": order.ShippedAddress.Pincode,
                // "city": order.ShippedAddress.City,
                // "state":order.ShippedAddress.State,
                // "Mob No":order.ShippedAddress.Mobaile,
                // "state": order.ShippedAddress.State,
                // "Mob No": order.ShippedAddress.Mobaile
            },
            "information": {
                "number": order._id,
                "date": order.orderDate,
                "due-date": order.orderDate
            },
            "products": order.products.map((product) => ({
                "quantity": product.quantity,
                "description": product.productId.ProductName, // You might want to use product description here
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

        // Translate your invoice to your preferred language
        "translate": {
            // "invoice": "FACTUUR",  // Default to 'INVOICE'
            // "number": "Nummer", // Defaults to 'Number'
            // "date": "Datum", // Default to 'Date'
            // "due-date": "Verloopdatum", // Defaults to 'Due Date'
            // "subtotal": "Subtotaal", // Defaults to 'Subtotal'
            // "products": "Producten", // Defaults to 'Products'
            // "quantity": "Aantal", // Default to 'Quantity'
            // "price": "Prijs", // Defaults to 'Price'
            // "product-total": "Totaal", // Defaults to 'Total'
            // "total": "Totaal", // Defaults to 'Total'
            // "vat": "btw" // Defaults to 'vat'
        }
    }

    //Create your invoice! Easy!

      // Create a Promise to handle the asynchronous file writing
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
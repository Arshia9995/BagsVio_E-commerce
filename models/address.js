const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  addresses: [{
    name: { type: String, required: true },
    addressline: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    mobile: { type: Number, required: true }
  }]
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;

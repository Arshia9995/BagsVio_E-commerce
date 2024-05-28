const { ObjectId } = require("bson");
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionType: { type: String, enum: ['debit', 'credit','referral'] }, 
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  from: { type: String }, 
  orderId: { type: ObjectId }, 
  paymentId:{type: String}
});

const walletSchema = mongoose.Schema({
  userId: {
    type: ObjectId,
    required: true,
  },
  balance: {
    type: Number,
  },
  transactions: [transactionSchema], 
});

const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;            
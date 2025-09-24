import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  reference: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  status: { 
    type: String, 
    required: true,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  currency: { 
    type: String, 
    default: 'NGN',
    uppercase: true 
  },
  customer_email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true 
  },
  customer_name: { 
    type: String,
    trim: true 
  },
  meter_number: { 
    type: String,
    trim: true 
  },
  meter_id: String,
  metadata: {
    pricePerKg: { 
      type: Number,
      min: 0 
    },
    nairaAmount: { 
      type: Number,
      min: 0 
    },
    units: { 
      type: Number,
      min: 0 
    },
    userId: String
  },
  created_at: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  paid_at: Date,
  verified_at: Date,
  gateway_response: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Add indexes for common queries
paymentSchema.index({ customer_email: 1, created_at: -1 });
paymentSchema.index({ meter_number: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
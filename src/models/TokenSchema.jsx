import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  reference: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  token: { 
    type: String, 
    required: true,
    minlength: 20,
    maxlength: 20 
  },
  meterNumber: { 
    type: String, 
    required: true,
    trim: true 
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0 
  },
  units: { 
    type: Number, 
    required: true,
    min: 0 
  },
  customerEmail: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true 
  },
  customerName: { 
    type: String,
    trim: true 
  },
  userId: String,
  pricePerKg: { 
    type: Number, 
    required: true,
    min: 0 
  },
  created_at: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: true 
  },
  isUsed: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  usedAt: Date
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Add indexes for common queries
tokenSchema.index({ customerEmail: 1, created_at: -1 });
tokenSchema.index({ meterNumber: 1, created_at: -1 });

export default mongoose.models.Token || mongoose.model('Token', tokenSchema);
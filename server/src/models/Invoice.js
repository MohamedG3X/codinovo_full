import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  apiUser:      { type: mongoose.Schema.Types.ObjectId, ref: 'ApiUser', required: true },
  periodStart:  { type: Date, required: true },
  periodEnd:    { type: Date, required: true },

  // these names are what your routes/front-end use
  messageCount: { type: Number, default: 0 },
  totalAmount:  { type: Number, default: 0 },
  currency:     { type: String,  default: 'USD' },

  status: { type: String, enum: ['PENDING', 'PAID', 'ISSUED'], default: 'PENDING' },

  pdfPath: { type: String }
}, { timestamps: true });

export default mongoose.model('Invoice', InvoiceSchema);
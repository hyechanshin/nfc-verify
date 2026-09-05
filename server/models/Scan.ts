import mongoose, { Schema, Document } from 'mongoose';

export interface ScanDocument extends Document {
  tagUid: string;
  counter?: number;
  valid?: boolean;
  scannedAt: Date;
  ip?: string;
}

const scanSchema = new Schema<ScanDocument>({
  tagUid: { type: String, required: true },
  counter: Number,
  valid: Boolean,
  scannedAt: { type: Date, default: Date.now },
  ip: String
});

export default mongoose.model<ScanDocument>('Scan', scanSchema);

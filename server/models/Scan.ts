import mongoose, { Schema, Document } from 'mongoose';

// ok: genuine tap. bad_cmac: signature does not match the tag's key.
// replay: valid signature, but the counter is not higher than the last genuine tap.
export type ScanReason = 'ok' | 'bad_cmac' | 'replay';

export interface ScanDocument extends Document {
  tagUid: string;
  counter?: number;
  cmac?: string;
  valid?: boolean;
  reason?: ScanReason;
  scannedAt: Date;
  ip?: string;
}

const scanSchema = new Schema<ScanDocument>({
  tagUid: { type: String, required: true },
  counter: Number,
  cmac: String,
  valid: Boolean,
  reason: { type: String, enum: ['ok', 'bad_cmac', 'replay'] },
  scannedAt: { type: Date, default: Date.now },
  ip: String
});

export default mongoose.model<ScanDocument>('Scan', scanSchema);

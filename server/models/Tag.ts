import mongoose, { Schema, Document } from 'mongoose';

export interface TagDocument extends Document {
  uid: string;
  ownerName?: string;
  itemName?: string;
  sdmFileReadKey: string;
  keyCheckValue?: string;
  createdAt: Date;
}

const tagSchema = new Schema<TagDocument>({
  uid: {
    type: String,
    required: [true, 'UID is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[0-9A-F]{14}$/, 'UID must be 14 hex characters (7 bytes)']
  },
  ownerName: { type: String, trim: true },
  itemName: { type: String, trim: true },
  // Secret, encrypted with AES-256-GCM (see secure.ts) and never returned by
  // queries unless explicitly selected. The route checks the plain key's format.
  sdmFileReadKey: { type: String, required: [true, 'Key is required'], select: false },
  // Not secret: identifies the key (and spots the factory default) without revealing it.
  keyCheckValue: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<TagDocument>('Tag', tagSchema);

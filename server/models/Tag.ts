import mongoose, { Schema, Document } from 'mongoose';

export interface TagDocument extends Document {
  uid: string;
  ownerName?: string;
  itemName?: string;
  sdmFileReadKey: string;
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
  // Secret: never returned by queries unless explicitly selected.
  sdmFileReadKey: {
    type: String,
    required: [true, 'Key is required'],
    uppercase: true,
    trim: true,
    match: [/^[0-9A-F]{32}$/, 'Key must be 32 hex characters (16 bytes)'],
    select: false
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<TagDocument>('Tag', tagSchema);

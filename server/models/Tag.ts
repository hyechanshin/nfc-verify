import mongoose, { Schema, Document } from 'mongoose';

export interface TagDocument extends Document {
  uid: string;
  ownerName?: string;
  itemName?: string;
  sdmFileReadKey: string;
  createdAt: Date;
}

const tagSchema = new Schema<TagDocument>({
  uid: { type: String, required: true, unique: true },
  ownerName: String,
  itemName: String,
  sdmFileReadKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<TagDocument>('Tag', tagSchema);

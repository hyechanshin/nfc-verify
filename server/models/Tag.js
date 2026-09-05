const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // tag UID, hex string
  ownerName: String,
  itemName: String,
  sdmFileReadKey: { type: String, required: true }, // hex AES key set in GoToTags — keep private
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tag', tagSchema);

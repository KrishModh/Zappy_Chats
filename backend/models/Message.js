import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, trim: true, maxlength: 5000, default: '' },
  image: { type: String, default: '' },
  clientMessageId: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  isDeleted: { type: Boolean, default: false },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  timestamp: { type: Date, default: Date.now }
});

messageSchema.index({ chatId: 1, timestamp: 1 });

export default mongoose.model('Message', messageSchema);
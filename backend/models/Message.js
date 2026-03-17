import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, trim: true },
  image: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema);

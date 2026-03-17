import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: '' },
    phone: { type: String, required: true },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

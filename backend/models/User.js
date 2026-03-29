import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
    password: { type: String, required: true },
    profilePic: { type: String, default: '' },
    phone: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    dob: { type: Date, required: true },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);

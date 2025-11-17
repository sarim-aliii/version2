// sarim-aliii/version2/version2-1493846b30acdc91c679cab38a402d8b18ff91c6/server/src/models/User.ts
import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document properties
interface IUser {
  email: string;
  password?: string; // <-- Made password optional
  avatar?: string;
  authMethod?: 'email' | 'google' | 'github'; // <-- Added authMethod
}

// Interface for User document methods
interface IUserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

export interface IUserDocument extends IUser, IUserMethods, Document {}

interface IUserModel extends Model<IUserDocument> {}


const userSchema = new mongoose.Schema<IUserDocument, IUserModel>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: false, // <-- Set to false
  },
  avatar: {
    type: String,
    default: 'avatar-1',
  },
  authMethod: { // <-- Added authMethod to schema
    type: String,
    enum: ['email', 'google', 'github'],
    default: 'email',
  },
}, {
  timestamps: true,
});

// Middleware to hash password before saving
userSchema.pre<IUserDocument>('save', async function (next) {
  // Only hash if password exists and is modified
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  if (!this.password) return false; // <-- Handle users with no password
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
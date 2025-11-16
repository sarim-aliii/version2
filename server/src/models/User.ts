
// FIX: This file contained placeholder text. Implementing a Mongoose User schema with password hashing for secure authentication.
import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// Interface for User document properties
interface IUser {
  email: string;
  password: string;
  avatar?: string;
}

// Interface for User document methods
interface IUserMethods {
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// Combine properties and methods into a single document interface, extending Mongoose's Document
// FIX: Added explicit types for the User schema and model to make custom methods like `matchPassword` available to TypeScript.
export interface IUserDocument extends IUser, IUserMethods, Document {}

// Interface for the User model (for static methods, if any)
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
    required: true,
  },
  avatar: {
    type: String,
    default: 'avatar-1',
  },
}, {
  timestamps: true,
});

// Middleware to hash password before saving
// FIX: Use a generic on the 'pre' hook to correctly type `this` and allow access to Mongoose document methods like `isModified`.
userSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};


const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
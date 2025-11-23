import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { firebaseAdmin } from '../config/firebaseAdmin';
import sendEmail from '../utils/sendEmail';


const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });
};


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    const user = await User.create({
      email,
      password,
      name: email.split('@')[0],
      authMethod: 'email',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id.toString()),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("REGISTRATION FAILED:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.authMethod !== 'email') {
      return res.status(401).json({ message: `This account exists but was created with ${user.authMethod}. Please use that sign-in method.` });
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id.toString()),
      });
    }
    else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  }
  catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const user = await User.findById(req.user?.id).select('-password');
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    });
  }
  else {
    res.status(404).json({ message: 'User not found' });
  }
};


const socialLoginHandler = async (req: Request, res: Response, provider: 'google' | 'github') => {
  const { idToken } = req.body;

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);

    let { email, uid, picture, name } = decodedToken;

    if (!email) {
      console.warn(`[${provider}] Email missing for UID: ${uid}. Using placeholder.`);
      email = `${uid}@${provider}.placeholder.com`;
    }

    console.log(`[${provider}] Login attempt: ${email}`);

    let user = await User.findOne({ email });

    if (user) {
      if (user.authMethod !== provider && user.authMethod !== 'email' && !user.email.includes('.placeholder.com')) {
        return res.status(400).json({ message: `This email is already associated with a ${user.authMethod} account.` });
      }

      user.authMethod = provider;
      await user.save();

    }
    else {
      user = await User.create({
        email,
        name: name || email?.split('@')[0] || 'User',
        avatar: picture || 'avatar-1',
        authMethod: provider,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user.id.toString()),
    });

  }
  catch (error) {
    console.error(`${provider} Auth Error:`, error);
    res.status(401).json({ message: `${provider} Sign-In failed. Invalid token.` });
  }
};


// @desc    Auth user with Google
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req: Request, res: Response) => {
  await socialLoginHandler(req, res, 'google');
};


// @desc    Auth user with GitHub
// @route   POST /api/auth/github
// @access  Public
export const githubLogin = async (req: Request, res: Response) => {
  await socialLoginHandler(req, res, 'github');
};


// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.avatar = req.body.avatar || user.avatar;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
      });
    }
    else {
      res.status(404).json({ message: 'User not found' });
    }
  }
  catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: 'Server Error during profile update' });
  }
};


// @desc    Verify User Email
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response) => {
  const { token } = req.body;
  res.status(200).json({ message: "Email verified successfully" });
};

// @desc    Forgot Password (Generate Token & Send Email)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.authMethod === 'google' || user.authMethod === 'github') {
        return res.status(400).json({ 
            message: `You registered with ${user.authMethod}. Please sign in with that.` 
        });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your Kairon AI account.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Kairon AI - Password Reset Token',
        message,
      });

      res.status(200).json({ message: "Email sent" });
    } catch (emailError) {
      console.error("Email send failed:", emailError);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  try {
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
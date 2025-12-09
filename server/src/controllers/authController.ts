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

    // Generate Verification Token (6-digit OTP)
    const verificationToken = crypto.randomInt(100000, 999999).toString();
    
    // Hash the token for database storage
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    const user = await User.create({
      email,
      password,
      name: email.split('@')[0],
      authMethod: 'email',
      verificationToken: verificationTokenHash, // Storing the HASHED token
      isVerified: false
    });

    if (user) {
      // Send Email with the RAW verificationToken (the 6-digit number)
      const message = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Verify Your Email</h2>
          <p>Thanks for signing up for Kairon AI!</p>
          <p>Please use the following OTP to verify your account:</p>
          
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${verificationToken}</h1>
          </div>

          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `;

      try {
        await sendEmail({
          email: user.email,
          subject: 'Kairon AI - Verify Your Account',
          message,
        });

        res.status(201).json({
          message: 'Registration successful. Please check your email for the verification code.',
          email: user.email
        });
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        // Note: Ideally you might want to delete the user here if email fails, so they can try registering again
        res.status(500).json({ message: 'User registered, but failed to send verification email.' });
      }
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
      // Check if verified
      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email address before logging in.' });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id.toString()),
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        todos: user.todos
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
  const user = await User.findById(req.user?.id).select('-password');
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      xp: user.xp || 0,
      level: user.level || 1,
      currentStreak: user.currentStreak || 0,
      dailyStats: user.dailyStats || [],
      skillStats: user.skillStats || {},
      todos: user.todos || []
    });
  }
  else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Update User Todos
// @route   PUT /api/auth/todos
// @access  Private
export const updateUserTodos = async (req: Request, res: Response) => {
  const { todos } = req.body;

  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.todos = todos;
    const updatedUser = await user.save();

    res.json({
      message: 'Todos updated',
      todos: updatedUser.todos
    });

  } catch (error) {
    console.error("Todo Update Error:", error);
    res.status(500).json({ message: 'Server Error' });
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
      // Social login users are automatically verified
      if (!user.isVerified) user.isVerified = true;
      await user.save();

    }
    else {
      user = await User.create({
        email,
        name: name || email?.split('@')[0] || 'User',
        avatar: picture || 'avatar-1',
        authMethod: provider,
        isVerified: true // Auto-verify social logins
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user.id.toString()),
      xp: user.xp,
      level: user.level,
      currentStreak: user.currentStreak,
      todos: user.todos
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

  try {
    // Hash the token to compare with DB
    const verificationTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      verificationToken: verificationTokenHash
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully",
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user.id.toString()),
      xp: user.xp,
      level: user.level,
      currentStreak: user.currentStreak,
      todos: user.todos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Forgot Password (Generate OTP & Send Email)
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

    // 1. Generate 6-digit OTP
    const resetOTP = crypto.randomInt(100000, 999999).toString();

    // 2. Hash it for the DB
    user.resetPasswordToken = crypto.createHash('sha256').update(resetOTP).digest('hex');
    user.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 Minutes
    await user.save();

    // 3. Send Email with OTP (Clean Template)
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your Kairon AI account.</p>
        <p>Please use the following code to reset your password:</p>
        
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${resetOTP}</h1>
        </div>

        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Kairon AI - Password Reset Code',
        message,
      });

      res.status(200).json({ message: "OTP sent to email" });
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


// @desc    Reset Password (Verify OTP & Set New Password)
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
  // NOTE: We now require EMAIL + OTP + PASSWORD
  const { email, otp, password } = req.body;

  try {
    // 1. Hash the incoming OTP to match DB
    const resetPasswordTokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    // 2. Find user by EMAIL and TOKEN
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: resetPasswordTokenHash,
      resetPasswordExpire: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid Code or Expired" });
    }

    // 3. Update Password
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


// @desc    Update User Progress (XP, Streak, & Stats)
// @route   PUT /api/auth/progress
// @access  Private
export const updateUserProgress = async (req: Request, res: Response) => {
  const { xpGained, category } = req.body;

  if (!req.user) return res.status(401).json({ message: 'Not authorized' });

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Streak Calculation
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    today.setHours(0, 0, 0, 0);

    let lastStudy = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
    if (lastStudy) lastStudy.setHours(0, 0, 0, 0);

    if (!lastStudy) {
      user.currentStreak = 1;
    } else if (lastStudy.getTime() !== today.getTime()) {
      const diffTime = Math.abs(today.getTime() - lastStudy.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.currentStreak = (user.currentStreak || 0) + 1;
      } else {
        user.currentStreak = 1;
      }
    }

    user.lastStudyDate = new Date();

    // XP & Level Logic
    user.xp = (user.xp || 0) + xpGained;
    user.level = Math.floor(user.xp / 100) + 1;

    // --- Analytics Logic ---

    // 1. Daily Stats
    if (!user.dailyStats) user.dailyStats = [];
    const todayStatIndex = user.dailyStats.findIndex(s => s.date === dateString);
    if (todayStatIndex >= 0) {
      user.dailyStats[todayStatIndex].xp += xpGained;
    } else {
      // Keep only last 30 days to save space
      if (user.dailyStats.length > 30) user.dailyStats.shift();
      user.dailyStats.push({ date: dateString, xp: xpGained });
    }

    // 2. Skill Stats (if category provided)
    if (category) {
      if (!user.skillStats) user.skillStats = new Map();
      const currentSkillXp = user.skillStats.get(category) || 0;
      user.skillStats.set(category, currentSkillXp + xpGained);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      xp: updatedUser.xp,
      level: updatedUser.level,
      currentStreak: updatedUser.currentStreak,
      dailyStats: updatedUser.dailyStats,
      skillStats: updatedUser.skillStats,
      todos: updatedUser.todos
    });

  } catch (error) {
    console.error("Progress Update Error:", error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// ... existing imports

// @desc    Resend Verification Email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerificationEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "This account is already verified." });
    }

    // Generate NEW Token
    const verificationToken = crypto.randomInt(100000, 999999).toString();
    const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    // Update User
    user.verificationToken = verificationTokenHash;
    await user.save();

    // Send Email
    const message = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verify Your Email</h2>
        <p>You requested a new verification code for Kairon AI.</p>
        <p>Please use the following OTP to verify your account:</p>
        
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <h1 style="color: #333; margin: 0; letter-spacing: 5px;">${verificationToken}</h1>
        </div>

        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Kairon AI - New Verification Code',
      message,
    });

    res.status(200).json({ message: "Verification code sent" });

  } catch (error) {
    console.error("Resend Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
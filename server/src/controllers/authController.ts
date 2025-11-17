import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { firebaseAdmin } from '../config/firebaseAdmin';


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
      authMethod: 'email', // Explicitly set authMethod
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
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && user.authMethod !== 'email') {
      return res.status(401).json({ message: `This account exists but was created with ${user.authMethod}. Please use that sign-in method.` });
    }

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user.id.toString()),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
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
            email: user.email,
            avatar: user.avatar,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// REUSABLE HANDLER FOR SOCIAL LOGINS
const socialLoginHandler = async (req: Request, res: Response, provider: 'google' | 'github') => {
  const { idToken } = req.body;
  
  try {
    // Verify the token with Firebase Admin. This works for both Google & GitHub.
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    const { email, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ message: `Email not found in ${provider} token` });
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists
      if (user.authMethod !== provider && user.authMethod !== 'email') {
         // User exists but with a *different* social provider
         return res.status(400).json({ message: `This email is already associated with a ${user.authMethod} account.` });
      }
      // If they signed up with email, or this provider before, update authMethod
      user.authMethod = provider;
      await user.save();

    } else {
      // New user, create them in our DB
      user = await User.create({
        email,
        avatar: 'avatar-1', // You could use 'picture' from the token if you want
        authMethod: provider,
        // Password is not required
      });
    }

    // Send back your app's own JWT
    res.json({
      _id: user._id,
      email: user.email,
      avatar: user.avatar,
      token: generateToken(user.id.toString()),
    });

  } catch (error) {
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
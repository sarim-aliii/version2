
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Helper to generate token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// FIX: Use Request and Response from express to get correct type inference for req.body, res.status etc.
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
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id.toString()),
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
// FIX: Use Request and Response from express to get correct type inference for req.body, res.status etc.
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        avatar: user.avatar,
        token: generateToken(user._id.toString()),
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
// FIX: Use Request and Response from express to get correct type inference for req.body, res.status etc.
export const getUserProfile = async (req: Request, res: Response) => {
    // req.user is attached by the 'protect' middleware
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

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

interface JwtPayload {
  id: string;
}

// FIX: Use Request, Response, and NextFunction from express to avoid type conflicts and ensure correct type inference.
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
         res.status(401).json({ message: 'Not authorized, user not found' });
         return;
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};
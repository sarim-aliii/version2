import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/AppError';
import User from '../models/User';
import StudyProject from '../models/StudyProject';

// @desc    Get Global Leaderboard (Top 10 by XP)
// @route   GET /api/social/leaderboard
// @access  Private
export const getLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const topUsers = await User.find({})
    .sort({ xp: -1 })
    .limit(10)
    .select('name avatar xp level currentStreak'); 

  res.json(topUsers);
});

// @desc    Share a project with another user by Email
// @route   POST /api/projects/:id/share
// @access  Private
export const shareProject = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const projectId = req.params.id;

  const project = await StudyProject.findById(projectId);

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (!req.user) {
    throw new AppError('Not authenticated', 401);
  }

  if (project.owner.toString() !== req.user.id) {
    throw new AppError('Not authorized to share this project', 401);
  }

  const userToShare = await User.findOne({ email });

  if (!userToShare) {
    throw new AppError('User with this email not found', 404);
  }

  // Ensure sharedWith is initialized
  if (!project.sharedWith) {
      project.sharedWith = [];
  }

  if (project.sharedWith.includes(userToShare._id)) {
    throw new AppError('Project already shared with this user', 400);
  }

  project.sharedWith.push(userToShare._id);
  await project.save();

  res.json({ message: `Project shared with ${userToShare.name}` });
});

import { Request, Response } from 'express';
import StudyProject from '../models/StudyProject';

// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
// FIX: Use Request and Response from express to get correct type inference.
export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await StudyProject.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single project by ID
// @route   GET /api/projects/:id
// @access  Private
// FIX: Use Request and Response from express to get correct type inference.
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const project = await StudyProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.owner.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
// FIX: Use Request and Response from express to get correct type inference.
export const createProject = async (req: Request, res: Response) => {
  const { name, ingestedText } = req.body;
  try {
    const newProject = new StudyProject({
      name,
      ingestedText,
      owner: req.user.id,
    });
    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (error) {
    res.status(400).json({ message: 'Invalid project data' });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private
// FIX: Use Request and Response from express to get correct type inference.
export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await StudyProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.owner.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Whitelist fields that can be updated
    const { name, summary, srsFlashcards, mcqAttempts, semanticSearchHistory, aiTutorHistory, lessonPlan, studyPlan, conceptMapData } = req.body;
    if (name) project.name = name;
    if (summary) project.summary = summary;
    if (srsFlashcards) project.srsFlashcards = srsFlashcards;
    if (mcqAttempts) project.mcqAttempts = mcqAttempts;
    if (semanticSearchHistory) project.semanticSearchHistory = semanticSearchHistory;
    if (aiTutorHistory) project.aiTutorHistory = aiTutorHistory;
    if (lessonPlan) project.lessonPlan = lessonPlan;
    if (studyPlan) project.studyPlan = studyPlan;
    if (conceptMapData) project.conceptMapData = conceptMapData;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    res.status(400).json({ message: 'Project update failed' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
// FIX: Use Request and Response from express to get correct type inference.
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await StudyProject.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.owner.toString() !== req.user.id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    await project.deleteOne();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
import { Request, Response } from 'express';
import StudyProject from '../models/StudyProject';


// @desc    Get all projects for a user
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req: Request, res: Response) => {
  if (!req.user) {
     res.status(401).json({ message: 'Not authorized' });
     return;
  }

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
export const getProjectById = async (req: Request, res: Response) => {
  if (!req.user) {
     res.status(401).json({ message: 'Not authorized' });
     return;
  }

  try {
    const project = await StudyProject.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (project.owner.toString() !== req.user.id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req: Request, res: Response) => {
  if (!req.user) {
     res.status(401).json({ message: 'Not authorized' });
     return;
  }

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
export const updateProject = async (req: Request, res: Response) => {
  if (!req.user) {
     res.status(401).json({ message: 'Not authorized' });
     return;
  }

  try {
    const project = await StudyProject.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (project.owner.toString() !== req.user.id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    
    const { 
        name, 
        ingestedText,
        summary, 
        srsFlashcards, 
        mcqAttempts, 
        currentMcqs,
        semanticSearchHistory, 
        aiTutorHistory, 
        lessonPlan, 
        studyPlan, 
        conceptMapData,
        codeSnippet,
        codeAnalysis,
        todos
    } = req.body;

    if (name) project.name = name;
    if (ingestedText) project.ingestedText = ingestedText;
    if (summary) project.summary = summary;
    if (srsFlashcards) project.srsFlashcards = srsFlashcards;
    if (mcqAttempts) project.mcqAttempts = mcqAttempts;
    if (currentMcqs) project.currentMcqs = currentMcqs;
    if (semanticSearchHistory) project.semanticSearchHistory = semanticSearchHistory;
    if (aiTutorHistory) project.aiTutorHistory = aiTutorHistory;
    if (lessonPlan) project.lessonPlan = lessonPlan;
    if (studyPlan) project.studyPlan = studyPlan;
    if (conceptMapData) project.conceptMapData = conceptMapData;
    if (codeSnippet) project.codeSnippet = codeSnippet;
    if (codeAnalysis) project.codeAnalysis = codeAnalysis;
    if (todos) project.todos = todos;

    const updatedProject = await project.save();
    res.json(updatedProject);
  } catch (error) {
    console.error("Update Project Error:", error);
    res.status(400).json({ message: 'Project update failed' });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req: Request, res: Response) => {
  if (!req.user) {
     res.status(401).json({ message: 'Not authorized' });
     return;
  }

  try {
    const project = await StudyProject.findById(req.params.id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    if (project.owner.toString() !== req.user.id.toString()) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    await project.deleteOne();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
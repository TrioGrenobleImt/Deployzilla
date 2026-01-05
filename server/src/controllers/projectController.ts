import { Request, Response, RequestHandler } from "express";
import { Project } from "../models/projectModel.js";

/**
 * Creates a new project.
 */
export const createProject: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, repoUrl, branch, autoDeploy } = req.body;

    const existingProject = await Project.findOne({ repoUrl });
    if (existingProject) {
      res.status(400).json({ error: "A project with this repository URL already exists." });
      return;
    }

    const project = new Project({
      name,
      repoUrl,
      branch,
      autoDeploy,
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Gets all projects.
 */
export const getProjects: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error getting projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Updates a project.
 */
export const updateProject: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const project = await Project.findByIdAndUpdate(id, updates, { new: true });
    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.status(200).json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Deletes a project.
 */
export const deleteProject: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await Project.findByIdAndDelete(id);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

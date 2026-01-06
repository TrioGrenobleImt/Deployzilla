import { Request, Response, RequestHandler } from "express";
import { Project } from "../models/projectModel.js";
import { encrypt, decrypt } from "../utils/cryptoUtils.js";

/**
 * Creates a new project.
 */
export const createProject: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, repoUrl, branch, autoDeploy, allowedUsers } = req.body;

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
      allowedUsers: allowedUsers || [],
      envVars: req.body.envVars
        ? req.body.envVars.map((v: { key: string; value: string }) => {
            const encrypted = encrypt(v.value);
            return { key: v.key, value: `${encrypted.iv}:${encrypted.content}` };
          })
        : [],
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
    const userId = req.userId;
    const userRole = req.role;

    let query = {};
    if (userRole !== "admin") {
      query = { allowedUsers: userId };
    }

    const projects = await Project.find(query).sort({ createdAt: -1 });
    const decryptedProjects = projects.map((project) => {
      const p = project.toObject();
      return {
        ...p,
        envVars: p.envVars?.map((v: { key: string; value: string }) => {
          if (v.value && v.value.includes(":")) {
            const [iv, content] = v.value.split(":");
            try {
              return { key: v.key, value: decrypt({ iv, content }) };
            } catch (e) {
              return v;
            }
          }
          return v;
        }),
      };
    });
    res.status(200).json(decryptedProjects);
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
    const { envVars, allowedUsers, ...otherUpdates } = req.body;
    let updates = { ...otherUpdates, envVars, allowedUsers };

    if (envVars) {
      updates.envVars = envVars.map((v: { key: string; value: string }) => {
        const encrypted = encrypt(v.value);
        return { key: v.key, value: `${encrypted.iv}:${encrypted.content}` };
      });
    }

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

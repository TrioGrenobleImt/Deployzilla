import { Request, Response, RequestHandler } from "express";
import { Pipeline } from "../models/pipelineModel.js";

/**
 * Fetches all pipelines for a specific project.
 */
export const getProjectPipelines: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      res.status(400).json({ error: "Project ID is required" });
      return;
    }

    const pipelines = await Pipeline.find({ projectId }).sort({ createdAt: -1 });

    res.status(200).json(pipelines);
  } catch (error: any) {
    console.error("Error fetching project pipelines:", error);
    res.status(500).json({ error: error.message });
  }
};

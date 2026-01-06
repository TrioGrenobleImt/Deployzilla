import { Schema, model, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  repoUrl: string;
  branch: string;
  autoDeploy: boolean;
  envVars: { key: string; value: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    repoUrl: { type: String, required: true },
    branch: { type: String, required: true, default: "main" },
    autoDeploy: { type: Boolean, default: true },
    envVars: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

// Allow same repoUrl with different branches
ProjectSchema.index({ repoUrl: 1, branch: 1 }, { unique: true });

export const Project = model<IProject>("Project", ProjectSchema);

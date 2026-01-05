import { Schema, model, Document } from "mongoose";

export interface IProject extends Document {
  name: string;
  repoUrl: string;
  branch: string;
  autoDeploy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    repoUrl: { type: String, required: true, unique: true },
    branch: { type: String, required: true, default: "main" },
    autoDeploy: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Project = model<IProject>("Project", ProjectSchema);

import { Schema, model, Document } from "mongoose";

export interface IPipeline extends Document {
  _id: string;
  projectId: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  jobs: any[];
  logs: any[];
  currentStage?: string;
  commitHash?: string;
  author?: string;
  trigger?: string;
  triggerAuthor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineSchema = new Schema<IPipeline>(
  {
    _id: { type: String, required: true },
    projectId: { type: String, required: true },
    status: { type: String, default: "PENDING" },
    jobs: { type: Schema.Types.Mixed, default: [] },
    logs: { type: Schema.Types.Mixed, default: [] },
    currentStage: { type: String },
    commitHash: { type: String },
    author: { type: String },
    trigger: { type: String },
    triggerAuthor: { type: String },
  },
  { timestamps: true, _id: false },
);

export const Pipeline = model<IPipeline>("Pipeline", PipelineSchema);

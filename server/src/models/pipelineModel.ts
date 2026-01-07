import { Schema, model, Document } from "mongoose";

export interface IPipeline extends Document {
  _id: string;
  projectId: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  jobs: any[];
  commitHash?: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineSchema = new Schema<IPipeline>(
  {
    _id: { type: String, required: true },
    projectId: { type: String, required: true },
    status: { type: String, default: "PENDING" },
    jobs: { type: Schema.Types.Mixed, default: [] },
    commitHash: { type: String },
    author: { type: String },
  },
  { timestamps: true, _id: false },
);

export const Pipeline = model<IPipeline>("Pipeline", PipelineSchema);

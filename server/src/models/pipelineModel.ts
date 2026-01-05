import { Schema, model, Document, Types } from "mongoose";

export interface IPipeline extends Document {
  projectId: Types.ObjectId;
  branch: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED";
  trigger: "manual" | "github";
  logId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineSchema = new Schema<IPipeline>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    branch: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "RUNNING", "SUCCESS", "FAILED"], default: "PENDING" },
    trigger: { type: String, enum: ["manual", "github"], default: "manual" },
    logId: { type: Schema.Types.ObjectId, ref: "Log" },
  },
  { timestamps: true },
);

export const Pipeline = model<IPipeline>("Pipeline", PipelineSchema);

// models/Progress.ts
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const ProgressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    mantra: { type: String, required: true, trim: true },
    count: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

// unique per user per mantra
ProgressSchema.index({ userId: 1, mantra: 1 }, { unique: true });

// Infer the document shape from the schema
export type ProgressDoc = InferSchemaType<typeof ProgressSchema>;

// Explicit model type
export type ProgressModel = Model<ProgressDoc>;

// Correctly typed export (avoid ReturnType<> here)
export const Progress: ProgressModel =
  (models.Progress as ProgressModel) || model<ProgressDoc>("Progress", ProgressSchema);

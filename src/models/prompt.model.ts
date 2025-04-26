import mongoose, { Schema, Document } from "mongoose";

export interface IPrompt extends Document {
  question: string;
  answer: string;
}

const PromptSchema: Schema = new Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

export default mongoose.model<IPrompt>("Prompt", PromptSchema);

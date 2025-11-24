import mongoose, { Model, Schema, Document, Types } from "mongoose";

export interface IWidget extends Document {
  userId: Types.ObjectId;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  description?: string;
  data?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const WidgetSchema = new Schema<IWidget>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  w: { type: Number, required: true },
  h: { type: Number, required: true },
  title: { type: String },
  description: { type: String },
  data: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Widget: Model<IWidget> = mongoose.models.Widget || mongoose.model<IWidget>("Widget", WidgetSchema);

export default Widget;

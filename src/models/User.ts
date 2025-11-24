import mongoose, { Model, Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

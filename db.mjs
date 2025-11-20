// db.mjs
import mongoose from "mongoose";

mongoose.connect(process.env.DSN);

const User = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  avatarUrl: { type: String }, // specific slug that links to user page (customizable)
  createdAt: { type: Date, default: Date.now() }
});

const Widget = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
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

mongoose.model("User", User);
mongoose.model("Widget", Widget);


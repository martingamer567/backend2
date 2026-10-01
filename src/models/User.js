import { ROLES } from "../config/roles.js";
import mongoose from "mongoose";

export const USER_ROLES = Object.values(ROLES);

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: "user" },
  },
  { timestamps: true, versionKey: false },
);

const User = mongoose.model("User", userSchema);

export default User;

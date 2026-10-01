import mongoose from "mongoose";

export const EVENT_STATUS = Object.freeze({
  PUBLISHED: "published",
  CANCELLED: "cancelled",
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    date: { type: Date, required: true },
    location: { type: String, trim: true, default: "" },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.PUBLISHED,
    },
  },
  { timestamps: true, versionKey: false },
);

const Event = mongoose.model("Event", eventSchema);

export default Event;
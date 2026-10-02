import mongoose from "mongoose";

export const EVENT_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  CANCELLED: "cancelled",
  FINISHED: "finished",
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.PUBLISHED,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

const Event = mongoose.model("Event", eventSchema);

export default Event;

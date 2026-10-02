import mongoose from "mongoose";

export const TICKET_STATUS = Object.freeze({
  CONFIRMED: "confirmed",
  PENDING: "pending",
  CANCELLED: "cancelled",
});

export const ACTIVE_TICKET_STATUSES = Object.freeze([
  TICKET_STATUS.CONFIRMED,
  TICKET_STATUS.PENDING,
]);

const ticketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.CONFIRMED,
    },
    quantity: { type: Number, required: true, min: 1 },
    reservationCode: { type: String, required: true, unique: true },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;

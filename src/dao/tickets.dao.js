import mongoose from "mongoose";
import Ticket, {
  ACTIVE_TICKET_STATUSES,
  TICKET_STATUS,
} from "../models/Ticket.js";

export default class TicketsDAO {
  create = (ticketData) => Ticket.create(ticketData);

  getById = (id) => Ticket.findById(id).lean();

  findActiveByUserAndEvent = (userId, eventId) =>
    Ticket.findOne({
      user: userId,
      event: eventId,
      status: { $in: ACTIVE_TICKET_STATUSES },
    }).lean();

  sumActiveQuantityByEvent = async (eventId) => {
    const result = await Ticket.aggregate([
      {
        $match: {
          event: new mongoose.Types.ObjectId(eventId),
          status: { $in: ACTIVE_TICKET_STATUSES },
        },
      },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
    return result[0]?.total ?? 0;
  };

  findByUser = (userId) =>
    Ticket.find({ user: userId })
      .populate("event", "title date location")
      .sort({ createdAt: -1 })
      .lean();

  findByEvent = (eventId) =>
    Ticket.find({ event: eventId })
      .populate("user", "first_name last_name email")
      .sort({ createdAt: -1 })
      .lean();

  cancel = (id) =>
    Ticket.findByIdAndUpdate(
      id,
      { status: TICKET_STATUS.CANCELLED, cancelledAt: new Date() },
      { returnDocument: "after" },
    ).lean();
}

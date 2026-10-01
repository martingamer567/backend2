import Event, { EVENT_STATUS } from "../models/Event.js";

export default class EventsDAO {
  create = (eventData) => Event.create(eventData);

  getPublished = () => Event.find({ status: EVENT_STATUS.PUBLISHED }).lean();

  getById = (id) => Event.findById(id).lean();

  update = (id, changes) =>
    Event.findByIdAndUpdate(id, changes, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
}
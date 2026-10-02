import Event from "../models/Event.js";

export default class EventsDAO {
  create = (eventData) => Event.create(eventData);

  getById = (id) => Event.findById(id).lean();

  findPaginated = ({ filter, sort, skip, limit }) =>
    Event.find(filter).sort(sort).skip(skip).limit(limit).lean();

  count = (filter) => Event.countDocuments(filter);

  update = (id, changes) =>
    Event.findByIdAndUpdate(id, changes, {
      returnDocument: "after",
      runValidators: true,
    }).lean();
}

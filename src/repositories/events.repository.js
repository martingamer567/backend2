import EventsDAO from "../dao/events.dao.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildEventsFilter = ({
  status,
  category,
  location,
  dateFrom,
  dateTo,
}) => {
  const filter = {};

  if (status) filter.status = status;

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  if (location) filter.location = new RegExp(`^${escapeRegex(location)}$`, "i");

  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) filter.date.$gte = dateFrom;
    if (dateTo) filter.date.$lte = dateTo;
  }

  return filter;
};

export default class EventsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  createEvent = (eventData) => this.dao.create(eventData);

  getEventById = (id) => this.dao.getById(id);

  findEvents = async ({ filters, sort, page, limit }) => {
    const filter = buildEventsFilter(filters);

    const [data, total] = await Promise.all([
      this.dao.findPaginated({
        filter,
        sort: { [sort.field]: sort.direction, _id: 1 },
        skip: (page - 1) * limit,
        limit,
      }),
      this.dao.count(filter),
    ]);

    return { data, total };
  };

  updateEvent = (id, changes) => this.dao.update(id, changes);
}

export const eventsRepository = new EventsRepository(new EventsDAO());

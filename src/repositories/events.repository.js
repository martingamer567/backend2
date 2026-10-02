import EventsDAO from "../dao/events.dao.js";

export default class EventsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  createEvent = (eventData) => this.dao.create(eventData);

  getEventById = (id) => this.dao.getById(id);

  getEvents = async ({ filter, sort, page, limit }) => {
    const [data, total] = await Promise.all([
      this.dao.findPaginated({
        filter,
        sort,
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

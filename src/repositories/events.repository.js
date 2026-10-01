import EventsDAO from "../dao/events.dao.js";

export default class EventsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  createEvent = (eventData) => this.dao.create(eventData);

  getPublishedEvents = () => this.dao.getPublished();

  getEventById = (id) => this.dao.getById(id);

  updateEvent = (id, changes) => this.dao.update(id, changes);
}

export const eventsRepository = new EventsRepository(new EventsDAO());
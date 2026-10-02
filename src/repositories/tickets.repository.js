import TicketsDAO from "../dao/tickets.dao.js";

export default class TicketsRepository {
  constructor(dao) {
    this.dao = dao;
  }

  createTicket = (ticketData) => this.dao.create(ticketData);

  getTicketById = (id) => this.dao.getById(id);

  getActiveTicket = (userId, eventId) =>
    this.dao.findActiveByUserAndEvent(userId, eventId);

  countReservedSeats = (eventId) => this.dao.sumActiveQuantityByEvent(eventId);

  getTicketsByUser = (userId) => this.dao.findByUser(userId);

  getTicketsByEvent = (eventId) => this.dao.findByEvent(eventId);

  cancelTicket = (id) => this.dao.cancel(id);
}

export const ticketsRepository = new TicketsRepository(new TicketsDAO());

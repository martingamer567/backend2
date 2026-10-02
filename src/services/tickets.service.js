import crypto from "crypto";
import { ticketsRepository } from "../repositories/tickets.repository.js";
import { eventsRepository } from "../repositories/events.repository.js";
import { EVENT_STATUS } from "../models/Event.js";
import { TICKET_STATUS } from "../models/Ticket.js";
import { ROLES } from "../config/roles.js";
import { HttpError } from "../utils/httpError.js";
import { sendEnrollmentConfirmation } from "../utils/mailer.js";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const assertValidId = (id, label) => {
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new HttpError(400, `El id del ${label} no es válido`);
  }
};

const generateReservationCode = () =>
  `RES-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const toPublicTicket = (ticket) => {
  const result = {
    id: ticket._id.toString(),
    status: ticket.status,
    quantity: ticket.quantity,
    reservationCode: ticket.reservationCode,
    createdAt: ticket.createdAt,
    cancelledAt: ticket.cancelledAt ?? null,
  };

  const { event, user } = ticket;

    if (event && event.title !== undefined) {
    result.event = {
      id: event._id.toString(),
      title: event.title,
      date: event.date,
      location: event.location,
    };
  } else {
    result.event = event ? event.toString() : null;
  }

  if (user && user.email !== undefined) {
    result.user = {
      id: user._id.toString(),
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    };
  } else {
    result.user = user ? user.toString() : null;
  }

  return result;
};

export default class TicketsService {
  constructor(ticketsRepo, eventsRepo, mailSender) {
    this.ticketsRepo = ticketsRepo;
    this.eventsRepo = eventsRepo;
    this.mailSender = mailSender;
  }

  createTicket = async (user, eventId, body) => {
    assertValidId(eventId, "evento");

    const event = await this.eventsRepo.getEventById(eventId);

    if (!event || event.status === EVENT_STATUS.DRAFT) {
      throw new HttpError(404, "Evento no encontrado");
    }

    if (event.status === EVENT_STATUS.CANCELLED) {
      throw new HttpError(
        409,
        "El evento está cancelado, no admite inscripciones",
      );
    }
    if (event.status === EVENT_STATUS.FINISHED) {
      throw new HttpError(
        409,
        "El evento ya finalizó, no admite inscripciones",
      );
    }

    const quantity = body?.quantity === undefined ? 1 : body.quantity;
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new HttpError(
        400,
        "La cantidad debe ser un número entero mayor que 0",
      );
    }

    const existing = await this.ticketsRepo.getActiveTicket(user.id, eventId);
    if (existing) {
      throw new HttpError(
        409,
        "Ya tenés una inscripción activa para este evento",
      );
    }

    const reserved = await this.ticketsRepo.countReservedSeats(eventId);
    const available = Math.max(event.capacity - reserved, 0);
    if (quantity > available) {
      throw new HttpError(
        409,
        `No hay cupos suficientes. Cupos disponibles: ${available}`,
      );
    }

    const ticket = await this.ticketsRepo.createTicket({
      user: user.id,
      event: eventId,
      quantity,
      status: TICKET_STATUS.CONFIRMED,
      reservationCode: generateReservationCode(),
    });

    try {
      await this.mailSender({ to: user.email, event, ticket });
    } catch (error) {
      console.error(
        "No se pudo enviar el email de confirmación:",
        error.message,
      );
    }

    return toPublicTicket(ticket);
  };

  getMyTickets = async (user) => {
    const tickets = await this.ticketsRepo.getTicketsByUser(user.id);
    return tickets.map(toPublicTicket);
  };

  getEventTickets = async (eventId, user) => {
    assertValidId(eventId, "evento");

    const event = await this.eventsRepo.getEventById(eventId);
    if (!event) {
      throw new HttpError(404, "Evento no encontrado");
    }

    const isOwner = event.organizer.toString() === user.id;
    if (user.role !== ROLES.ADMIN && !isOwner) {
      throw new HttpError(403, "No tenés permisos para realizar esta acción");
    }

    const tickets = await this.ticketsRepo.getTicketsByEvent(eventId);
    return tickets.map(toPublicTicket);
  };

  cancelTicket = async (ticketId, user) => {
    assertValidId(ticketId, "ticket");

    const ticket = await this.ticketsRepo.getTicketById(ticketId);
    if (!ticket) {
      throw new HttpError(404, "Ticket no encontrado");
    }

    const isOwner = ticket.user.toString() === user.id;
    if (user.role !== ROLES.ADMIN && !isOwner) {
      throw new HttpError(403, "No tenés permisos para realizar esta acción");
    }

    if (ticket.status === TICKET_STATUS.CANCELLED) {
      throw new HttpError(409, "El ticket ya está cancelado");
    }

    const cancelled = await this.ticketsRepo.cancelTicket(ticketId);
    return toPublicTicket(cancelled);
  };
}

export const ticketsService = new TicketsService(
  ticketsRepository,
  eventsRepository,
  sendEnrollmentConfirmation,
);

import { eventsRepository } from "../repositories/events.repository.js";
import { EVENT_STATUS } from "../models/Event.js";
import { ROLES } from "../config/roles.js";
import { HttpError } from "../utils/httpError.js";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const isMissing = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const toPublicEvent = (event) => ({
  id: event._id.toString(),
  title: event.title,
  description: event.description,
  date: event.date,
  location: event.location,
  organizer: event.organizer.toString(),
  status: event.status,
});

export default class EventsService {
  constructor(repository) {
    this.repository = repository;
  }

  getManageableEvent = async (id, user) => {
    if (!OBJECT_ID_REGEX.test(id)) {
      throw new HttpError(400, "El id del evento no es válido");
    }

    const event = await this.repository.getEventById(id);
    if (!event) {
      throw new HttpError(404, "Evento no encontrado");
    }

    const isOwner = event.organizer.toString() === user.id;
    if (user.role !== ROLES.ADMIN && !isOwner) {
      throw new HttpError(403, "No tenés permisos para realizar esta acción");
    }

    return event;
  };

  getPublishedEvents = async () => {
    const events = await this.repository.getPublishedEvents();
    return events.map(toPublicEvent);
  };

  createEvent = async (user, body) => {
    const { title, description, date, location } = body ?? {};

    if ([title, date].some(isMissing)) {
      throw new HttpError(400, "Faltan campos obligatorios");
    }

    if (
      typeof title !== "string" ||
      typeof date !== "string" ||
      (description !== undefined && typeof description !== "string") ||
      (location !== undefined && typeof location !== "string")
    ) {
      throw new HttpError(400, "Todos los campos deben ser de tipo texto");
    }

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new HttpError(400, "La fecha no es válida");
    }

    const event = await this.repository.createEvent({
      title,
      description,
      date: parsedDate,
      location,
      organizer: user.id,
    });

    return toPublicEvent(event);
  };

  updateEvent = async (id, user, body) => {
    await this.getManageableEvent(id, user);

    const { title, description, date, location } = body ?? {};
    const changes = {};

    if (title !== undefined) {
      if (typeof title !== "string" || isMissing(title)) {
        throw new HttpError(400, "El título no es válido");
      }
      changes.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        throw new HttpError(400, "La descripción no es válida");
      }
      changes.description = description.trim();
    }

    if (location !== undefined) {
      if (typeof location !== "string") {
        throw new HttpError(400, "La ubicación no es válida");
      }
      changes.location = location.trim();
    }

    if (date !== undefined) {
      const parsedDate = typeof date === "string" ? new Date(date) : null;
      if (!parsedDate || Number.isNaN(parsedDate.getTime())) {
        throw new HttpError(400, "La fecha no es válida");
      }
      changes.date = parsedDate;
    }

    if (Object.keys(changes).length === 0) {
      throw new HttpError(400, "No hay campos para actualizar");
    }

    const updated = await this.repository.updateEvent(id, changes);
    return toPublicEvent(updated);
  };

  cancelEvent = async (id, user) => {
    const event = await this.getManageableEvent(id, user);

    if (event.status === EVENT_STATUS.CANCELLED) {
      throw new HttpError(409, "El evento ya está cancelado");
    }

    const updated = await this.repository.updateEvent(id, {
      status: EVENT_STATUS.CANCELLED,
    });
    return toPublicEvent(updated);
  };
}

export const eventsService = new EventsService(eventsRepository);

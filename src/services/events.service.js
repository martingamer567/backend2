import { eventsRepository } from "../repositories/events.repository.js";
import { EVENT_STATUS } from "../models/Event.js";
import { ROLES } from "../config/roles.js";
import { HttpError } from "../utils/httpError.js";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULT_PAGE = 1;
const MAX_PAGE = 100000;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const DEFAULT_SORT = "date";
const SORTABLE_FIELDS = ["date", "price", "title", "createdAt"];

const TEXT_FIELDS = ["title", "description", "category", "location"];

const ALLOWED_TRANSITIONS = Object.freeze({
  [EVENT_STATUS.DRAFT]: [EVENT_STATUS.PUBLISHED, EVENT_STATUS.CANCELLED],
  [EVENT_STATUS.PUBLISHED]: [EVENT_STATUS.CANCELLED, EVENT_STATUS.FINISHED],
  [EVENT_STATUS.CANCELLED]: [],
  [EVENT_STATUS.FINISHED]: [],
});

const isMissing = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value) => {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isValidCapacity = (value) => Number.isInteger(value) && value > 0;

const isValidPrice = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const parseIntegerParam = (value, defaultValue, name, max) => {
  if (value === undefined) return defaultValue;

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new HttpError(400, `${name} debe ser un número entero positivo`);
  }

  const number = Number(value);
  if (number < 1 || number > max) {
    throw new HttpError(400, `${name} debe estar entre 1 y ${max}`);
  }

  return number;
};

const assertValidId = (id) => {
  if (!OBJECT_ID_REGEX.test(id)) {
    throw new HttpError(400, "El id del evento no es válido");
  }
};

const toPublicEvent = (event) => ({
  id: event._id.toString(),
  title: event.title,
  description: event.description,
  category: event.category,
  date: event.date,
  location: event.location,
  capacity: event.capacity,
  price: event.price,
  status: event.status,
  organizer: event.organizer.toString(),
});

export default class EventsService {
  constructor(repository) {
    this.repository = repository;
  }

  getManageableEvent = async (id, user) => {
    assertValidId(id);

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

  getEvents = async (query) => {
    const { status, category, location, dateFrom, dateTo, page, limit, sort } =
      query ?? {};

    const filter = {};

    if (status !== undefined && !Object.values(EVENT_STATUS).includes(status)) {
      throw new HttpError(
        400,
        `El estado no es válido. Valores permitidos: ${Object.values(EVENT_STATUS).join(", ")}`,
      );
    }
    const requestedStatus = status ?? EVENT_STATUS.PUBLISHED;
    filter.status =
      requestedStatus === EVENT_STATUS.DRAFT ? { $in: [] } : requestedStatus;

  
    if (category !== undefined) {
      if (!isNonEmptyString(category)) {
        throw new HttpError(400, "La categoría no es válida");
      }
      filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
    }

    if (location !== undefined) {
      if (!isNonEmptyString(location)) {
        throw new HttpError(400, "La ubicación no es válida");
      }
      filter.location = new RegExp(`^${escapeRegex(location.trim())}$`, "i");
    }

    const dateRange = {};

    if (dateFrom !== undefined) {
      const from = parseDate(dateFrom);
      if (!from) {
        throw new HttpError(400, "dateFrom no es una fecha válida");
      }
      dateRange.$gte = from;
    }

    if (dateTo !== undefined) {
      const to = parseDate(dateTo);
      if (!to) {
        throw new HttpError(400, "dateTo no es una fecha válida");
      }
      if (DATE_ONLY_REGEX.test(dateTo)) {
        to.setUTCHours(23, 59, 59, 999);
      }
      dateRange.$lte = to;
    }

    if (dateRange.$gte && dateRange.$lte && dateRange.$gte > dateRange.$lte) {
      throw new HttpError(400, "dateFrom no puede ser posterior a dateTo");
    }

    if (Object.keys(dateRange).length > 0) {
      filter.date = dateRange;
    }

    const currentPage = parseIntegerParam(page, DEFAULT_PAGE, "page", MAX_PAGE);
    const currentLimit = parseIntegerParam(
      limit,
      DEFAULT_LIMIT,
      "limit",
      MAX_LIMIT,
    );

    const sortParam = sort ?? DEFAULT_SORT;
    if (typeof sortParam !== "string") {
      throw new HttpError(400, "El ordenamiento no es válido");
    }
    const descending = sortParam.startsWith("-");
    const sortField = descending ? sortParam.slice(1) : sortParam;
    if (!SORTABLE_FIELDS.includes(sortField)) {
      throw new HttpError(
        400,
        `El ordenamiento no es válido. Campos permitidos: ${SORTABLE_FIELDS.join(", ")}`,
      );
    }

    const { data, total } = await this.repository.getEvents({
      filter,
      sort: { [sortField]: descending ? -1 : 1, _id: 1 },
      page: currentPage,
      limit: currentLimit,
    });

    return {
      data: data.map(toPublicEvent),
      page: currentPage,
      limit: currentLimit,
      total,
      totalPages: Math.ceil(total / currentLimit),
    };
  };

  getEventById = async (id) => {
    assertValidId(id);

    const event = await this.repository.getEventById(id);
    if (!event || event.status === EVENT_STATUS.DRAFT) {
      throw new HttpError(404, "Evento no encontrado");
    }

    return toPublicEvent(event);
  };

  createEvent = async (user, body) => {
    const { title, description, category, date, location, capacity, price } =
      body ?? {};
    const { status } = body ?? {};

    const textValues = [title, description, category, location];

    if ([...textValues, date, capacity, price].some(isMissing)) {
      throw new HttpError(400, "Faltan campos obligatorios");
    }

    if ([...textValues, date].some((value) => typeof value !== "string")) {
      throw new HttpError(
        400,
        "title, description, category, location y date deben ser de tipo texto",
      );
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      throw new HttpError(400, "La fecha no es válida");
    }
    if (parsedDate < new Date()) {
      throw new HttpError(400, "La fecha del evento no puede ser pasada");
    }

    if (!isValidCapacity(capacity)) {
      throw new HttpError(
        400,
        "La capacidad debe ser un número entero mayor que 0",
      );
    }

    if (!isValidPrice(price)) {
      throw new HttpError(
        400,
        "El precio debe ser un número mayor o igual a 0",
      );
    }

    let initialStatus = EVENT_STATUS.PUBLISHED;
    if (status !== undefined) {
      if (![EVENT_STATUS.DRAFT, EVENT_STATUS.PUBLISHED].includes(status)) {
        throw new HttpError(
          400,
          "Al crear, el estado solo puede ser draft o published",
        );
      }
      initialStatus = status;
    }

    const event = await this.repository.createEvent({
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      date: parsedDate,
      location: location.trim(),
      capacity,
      price,
      status: initialStatus,
      organizer: user.id,
    });

    return toPublicEvent(event);
  };

  updateEvent = async (id, user, body) => {
    const event = await this.getManageableEvent(id, user);

    if (event.status === EVENT_STATUS.CANCELLED) {
      throw new HttpError(409, "Un evento cancelado no puede modificarse");
    }

    const changes = {};

    for (const field of TEXT_FIELDS) {
      const value = body?.[field];
      if (value === undefined) continue;

      if (!isNonEmptyString(value)) {
        throw new HttpError(400, `El campo ${field} no es válido`);
      }
      changes[field] = value.trim();
    }

    if (body?.date !== undefined) {
      const parsedDate = parseDate(body.date);
      if (!parsedDate) {
        throw new HttpError(400, "La fecha no es válida");
      }
      changes.date = parsedDate;
    }

    if (body?.capacity !== undefined) {
      if (!isValidCapacity(body.capacity)) {
        throw new HttpError(
          400,
          "La capacidad debe ser un número entero mayor que 0",
        );
      }
      changes.capacity = body.capacity;
    }

    if (body?.price !== undefined) {
      if (!isValidPrice(body.price)) {
        throw new HttpError(
          400,
          "El precio debe ser un número mayor o igual a 0",
        );
      }
      changes.price = body.price;
    }

    if (Object.keys(changes).length === 0) {
      throw new HttpError(400, "No hay campos para actualizar");
    }

    const updated = await this.repository.updateEvent(id, changes);
    return toPublicEvent(updated);
  };

  changeEventStatus = async (id, user, body) => {
    const event = await this.getManageableEvent(id, user);

    const { status } = body ?? {};
    if (isMissing(status)) {
      throw new HttpError(400, "Falta el campo status");
    }
    if (!Object.values(EVENT_STATUS).includes(status)) {
      throw new HttpError(
        400,
        `El estado no es válido. Valores permitidos: ${Object.values(EVENT_STATUS).join(", ")}`,
      );
    }

    if (event.status === EVENT_STATUS.CANCELLED) {
      throw new HttpError(409, "Un evento cancelado no puede modificarse");
    }

    if (
      status === EVENT_STATUS.PUBLISHED &&
      event.status === EVENT_STATUS.FINISHED
    ) {
      throw new HttpError(409, "No se puede publicar un evento finalizado");
    }

    if (!ALLOWED_TRANSITIONS[event.status].includes(status)) {
      throw new HttpError(
        409,
        `No se puede cambiar el estado de ${event.status} a ${status}`,
      );
    }

    const updated = await this.repository.updateEvent(id, { status });
    return toPublicEvent(updated);
  };
}

export const eventsService = new EventsService(eventsRepository);

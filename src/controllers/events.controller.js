import { eventsService } from "../services/events.service.js";

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;

  if (statusCode === 500) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Error interno del servidor" });
  }

  return res
    .status(statusCode)
    .json({ status: "error", message: error.message });
};

export const getEvents = async (req, res) => {
  try {
    const events = await eventsService.getPublishedEvents();
    return res.status(200).json({ status: "success", payload: events });
  } catch (error) {
    return handleError(res, error);
  }
};

export const createEvent = async (req, res) => {
  try {
    const event = await eventsService.createEvent(req.user, req.body);
    return res.status(201).json({ status: "success", payload: event });
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateEvent = async (req, res) => {
  try {
    const event = await eventsService.updateEvent(
      req.params.id,
      req.user,
      req.body,
    );
    return res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelEvent = async (req, res) => {
  try {
    const event = await eventsService.cancelEvent(req.params.id, req.user);
    return res.status(200).json({ status: "success", payload: event });
  } catch (error) {
    return handleError(res, error);
  }
};

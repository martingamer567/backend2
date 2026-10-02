import { ticketsService } from "../services/tickets.service.js";

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

export const createTicket = async (req, res) => {
  try {
    const ticket = await ticketsService.createTicket(
      req.user,
      req.params.eid,
      req.body,
    );
    return res.status(201).json({ status: "success", payload: ticket });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await ticketsService.getMyTickets(req.user);
    return res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    return handleError(res, error);
  }
};

export const getEventTickets = async (req, res) => {
  try {
    const tickets = await ticketsService.getEventTickets(
      req.params.eid,
      req.user,
    );
    return res.status(200).json({ status: "success", payload: tickets });
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelTicket = async (req, res) => {
  try {
    const ticket = await ticketsService.cancelTicket(req.params.tid, req.user);
    return res.status(200).json({ status: "success", payload: ticket });
  } catch (error) {
    return handleError(res, error);
  }
};
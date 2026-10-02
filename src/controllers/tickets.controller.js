import { ticketsService } from "../services/tickets.service.js";
import { TicketDTO } from "../dto/ticket.dto.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketsService.createTicket(
    req.user,
    req.params.eid,
    req.body,
  );
  return res
    .status(201)
    .json({ status: "success", payload: new TicketDTO(ticket) });
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketsService.getMyTickets(req.user);
  return res.status(200).json({
    status: "success",
    payload: tickets.map((ticket) => new TicketDTO(ticket)),
  });
});

export const getEventTickets = asyncHandler(async (req, res) => {
  const tickets = await ticketsService.getEventTickets(
    req.params.eid,
    req.user,
  );
  return res.status(200).json({
    status: "success",
    payload: tickets.map((ticket) => new TicketDTO(ticket)),
  });
});

export const cancelTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketsService.cancelTicket(req.params.tid, req.user);
  return res
    .status(200)
    .json({ status: "success", payload: new TicketDTO(ticket) });
});

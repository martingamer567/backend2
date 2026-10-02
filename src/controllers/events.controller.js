import { eventsService } from "../services/events.service.js";
import { EventDTO } from "../dto/event.dto.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getEvents = asyncHandler(async (req, res) => {
  const { data, ...pagination } = await eventsService.getEvents(req.query);
  return res.status(200).json({
    status: "success",
    data: data.map((event) => new EventDTO(event)),
    ...pagination,
  });
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await eventsService.getEventById(req.params.id);
  return res
    .status(200)
    .json({ status: "success", payload: new EventDTO(event) });
});

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventsService.createEvent(req.user, req.body);
  return res
    .status(201)
    .json({ status: "success", payload: new EventDTO(event) });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventsService.updateEvent(
    req.params.id,
    req.user,
    req.body,
  );
  return res
    .status(200)
    .json({ status: "success", payload: new EventDTO(event) });
});

export const changeEventStatus = asyncHandler(async (req, res) => {
  const event = await eventsService.changeEventStatus(
    req.params.id,
    req.user,
    req.body,
  );
  return res
    .status(200)
    .json({ status: "success", payload: new EventDTO(event) });
});

import { Router } from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  changeEventStatus,
} from "../controllers/events.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { PERMISSIONS } from "../config/roles.js";

const router = Router();

router.get("/", getEvents);
router.get("/:id", getEventById);
router.post("/", auth, authorize(...PERMISSIONS.createEvents), createEvent);
router.put(
  "/:id",
  auth,
  authorize(...PERMISSIONS.manageOwnEvents),
  updateEvent,
);
router.patch(
  "/:id/status",
  auth,
  authorize(...PERMISSIONS.manageOwnEvents),
  changeEventStatus,
);

export default router;

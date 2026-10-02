import { Router } from "express";
import {
  getMyTickets,
  cancelTicket,
} from "../controllers/tickets.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/my-tickets", auth, getMyTickets);
router.patch("/:tid/cancel", auth, cancelTicket);

export default router;
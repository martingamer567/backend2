import { auth } from "../middlewares/auth.middleware.js";
import { Router } from "express";
import {
  getSessions,
  register,
  login,
  current,
  logout,
} from "../controllers/sessions.controller.js";
import { passportCall } from "../middlewares/passportCall.js";

const router = Router();

router.get("/current", auth, current);
router.get("/", getSessions);
router.post("/register", passportCall("register"), register);
router.post("/login", passportCall("login"), login);
router.post("/logout", logout);

export default router;

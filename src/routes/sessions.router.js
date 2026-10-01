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

router.get("/", getSessions);
router.post("/register", passportCall("register"), register);
router.post("/login", passportCall("login"), login);
router.get("/current", passportCall("current"), current);
router.post("/logout", logout);

export default router;
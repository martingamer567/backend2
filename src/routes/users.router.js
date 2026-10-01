import { Router } from "express";
import { getUsers } from "../controllers/users.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { PERMISSIONS } from "../config/roles.js";

const router = Router();

router.get("/", auth, authorize(...PERMISSIONS.viewAllUsers), getUsers);

export default router;
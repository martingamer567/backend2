import { sessionsService } from "../services/sessions.service.js";
import { config } from "../config/config.js";

const COOKIE_NAME = "currentUser";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.nodeEnv === "production",
};

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

export const getSessions = (req, res) => {
  res.status(200).json({ status: "success", payload: [] });
};

export const register = async (req, res) => {
  try {
    const user = await sessionsService.register(req.body);
    return res.status(201).json({ status: "success", payload: user });
  } catch (error) {
    return handleError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const token = await sessionsService.login(req.body);

    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 3600000 });
    return res
      .status(200)
      .json({ status: "success", message: "Login correcto" });
  } catch (error) {
    return handleError(res, error);
  }
};

export const current = (req, res) => {
  const { id, email, role } = req.user;
  return res
    .status(200)
    .json({ status: "success", payload: { id, email, role } });
};

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  return res.status(200).json({ status: "success", message: "Sesión cerrada" });
};

import { config } from "../config/config.js";
import { generateToken } from "../utils/jwt.js";

const COOKIE_NAME = "currentUser";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.nodeEnv === "production",
};

export const getSessions = (req, res) => {
  res.status(200).json({ status: "success", payload: [] });
};

export const register = (req, res) => {
  return res.status(201).json({ status: "success", payload: req.user });
};

export const login = (req, res) => {
  try {
    const { id, email, role } = req.user;
    const token = generateToken({ id, email, role });

    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 3600000 });
    return res
      .status(200)
      .json({ status: "success", message: "Login correcto" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Error interno del servidor" });
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
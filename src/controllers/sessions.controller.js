import { config } from "../config/config.js";
import { generateToken } from "../utils/jwt.js";
import { UserDTO, CurrentUserDTO } from "../dto/user.dto.js";

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
  return res
    .status(201)
    .json({ status: "success", payload: new UserDTO(req.user) });
};

export const login = (req, res) => {
  const token = generateToken({ ...new CurrentUserDTO(req.user) });

  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 3600000 });
  return res.status(200).json({ status: "success", message: "Login correcto" });
};

export const current = (req, res) => {
  return res
    .status(200)
    .json({ status: "success", payload: new CurrentUserDTO(req.user) });
};

export const logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  return res.status(200).json({ status: "success", message: "Sesión cerrada" });
};

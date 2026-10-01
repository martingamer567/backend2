import { verifyToken } from "../utils/jwt.js";

export const auth = (req, res, next) => {
  const token = req.cookies?.currentUser;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    return res.status(401).json({ status: "error", message: "No autenticado" });
  }

  req.user = payload;
  next();
};

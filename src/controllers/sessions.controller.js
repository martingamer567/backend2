import { sessionsService } from "../services/sessions.service.js";

export const getSessions = (req, res) => {
  res.status(200).json({ status: "success", payload: [] });
};

export const register = async (req, res) => {
  try {
    const user = await sessionsService.register(req.body);
    return res.status(201).json({ status: "success", payload: user });
  } catch (error) {
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
  }
};

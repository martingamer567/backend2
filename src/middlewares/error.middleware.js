export const notFound = (req, res) =>
  res.status(404).json({ status: "error", message: "Ruta no encontrada" });

export const errorHandler = (error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res
      .status(400)
      .json({ status: "error", message: "El body no es un JSON válido" });
  }

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

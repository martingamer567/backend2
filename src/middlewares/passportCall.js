import passport from "passport";

export const passportCall = (strategy) => (req, res, next) => {
  passport.authenticate(
    strategy,
    { session: false, badRequestMessage: "Faltan campos obligatorios" },
    (err, user, info, status) => {
      if (err) {
        console.error(err);
        return res
          .status(500)
          .json({ status: "error", message: "Error interno del servidor" });
      }
      if (!user) {
        const code = info?.status || status;
        return res
          .status(code || 401)
          .json({
            status: "error",
            message: code ? info.message : "No autenticado",
          });
      }
      req.user = user;
      return next();
    },
  )(req, res, next);
};

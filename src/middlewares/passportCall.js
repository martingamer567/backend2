import passport from "passport";
import { HttpError } from "../utils/httpError.js";

export const passportCall = (strategy) => (req, res, next) => {
  passport.authenticate(
    strategy,
    { session: false, badRequestMessage: "Faltan campos obligatorios" },
    (err, user, info, status) => {
      if (err) return next(err);

      if (!user) {
        const code = info?.status || status;
        return next(
          new HttpError(code || 401, code ? info.message : "No autenticado"),
        );
      }

      req.user = user;
      return next();
    },
  )(req, res, next);
};

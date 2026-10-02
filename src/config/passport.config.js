import passport from "passport";
import local from "passport-local";
import passportJwt from "passport-jwt";
import { config } from "./config.js";
import { usersService } from "../services/users.service.js";
import { HttpError } from "../utils/httpError.js";

const LocalStrategy = local.Strategy;
const JwtStrategy = passportJwt.Strategy;

const cookieExtractor = (req) => req?.cookies?.currentUser ?? null;

const handleError = (done, error) => {
  if (error instanceof HttpError) {
    return done(null, false, {
      status: error.statusCode,
      message: error.message,
    });
  }
  return done(error);
};

const registerStrategy = new LocalStrategy(
  { usernameField: "email", passReqToCallback: true },
  async (req, email, password, done) => {
    try {
      const { first_name, last_name } = req.body;
      const user = await usersService.register({
        first_name,
        last_name,
        email,
        password,
      });
      return done(null, user);
    } catch (error) {
      return handleError(done, error);
    }
  },
);

const loginStrategy = new LocalStrategy(
  { usernameField: "email" },
  async (email, password, done) => {
    try {
      const user = await usersService.authenticate({ email, password });
      return done(null, user);
    } catch (error) {
      return handleError(done, error);
    }
  },
);

const currentStrategy = new JwtStrategy(
  { jwtFromRequest: cookieExtractor, secretOrKey: config.jwtSecret },
  (payload, done) =>
    done(null, { id: payload.id, email: payload.email, role: payload.role }),
);

export const initializePassport = () => {
  passport.use("register", registerStrategy);
  passport.use("login", loginStrategy);
  passport.use("current", currentStrategy);
};

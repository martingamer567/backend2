import passport from "passport";
import local from "passport-local";
import passportJwt from "passport-jwt";
import { config } from "./config.js";
import { usersRepository } from "../repositories/users.repository.js";
import { createHash, isValidPassword } from "../utils/hash.js";

const LocalStrategy = local.Strategy;
const JwtStrategy = passportJwt.Strategy;

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isMissing = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const fail = (done, status, message) => done(null, false, { status, message });

const toPublicUser = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role,
});

const cookieExtractor = (req) => req?.cookies?.currentUser ?? null;

const registerStrategy = new LocalStrategy(
  { usernameField: "email", passReqToCallback: true },
  async (req, email, password, done) => {
    try {
      const { first_name, last_name } = req.body;
      const fields = [first_name, last_name, email, password];

      if (fields.some(isMissing)) {
        return fail(done, 400, "Faltan campos obligatorios");
      }

      if (fields.some((v) => typeof v !== "string")) {
        return fail(done, 400, "Todos los campos deben ser de tipo texto");
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return fail(done, 400, "El formato del email no es válido");
      }

      if (password.length < MIN_PASSWORD_LENGTH) {
        return fail(
          done,
          400,
          `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
        );
      }

      if (await usersRepository.getUserByEmail(normalizedEmail)) {
        return fail(done, 409, "El email ya está registrado");
      }

      const user = await usersRepository.createUser({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        password: await createHash(password),
      });

      return done(null, toPublicUser(user));
    } catch (error) {
      if (error.code === 11000) {
        return fail(done, 409, "El email ya está registrado");
      }
      return done(error);
    }
  },
);

const loginStrategy = new LocalStrategy(
  { usernameField: "email" },
  async (email, password, done) => {
    try {
      if ([email, password].some(isMissing)) {
        return fail(done, 400, "Faltan campos obligatorios");
      }

      if ([email, password].some((v) => typeof v !== "string")) {
        return fail(done, 400, "Todos los campos deben ser de tipo texto");
      }

      const user = await usersRepository.getUserByEmail(
        email.trim().toLowerCase(),
      );
      const valid = user
        ? await isValidPassword(password, user.password)
        : false;

      if (!valid) return fail(done, 401, "Credenciales inválidas");

      return done(null, {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      });
    } catch (error) {
      return done(error);
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
  // Futuros providers (Google, GitHub, etc.): crear la strategy arriba y registrarla acá con passport.use("google", ...)
};
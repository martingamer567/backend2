import { usersRepository } from "../repositories/users.repository.js";
import { createHash, isValidPassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { HttpError } from "../utils/httpError.js";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isMissing = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const toPublicUser = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role,
});

export default class SessionsService {
  constructor(repository) {
    this.repository = repository;
  }

  register = async (body) => {
    const { first_name, last_name, email, password } = body ?? {};

    if ([first_name, last_name, email, password].some(isMissing)) {
      throw new HttpError(400, "Faltan campos obligatorios");
    }

    if (
      [first_name, last_name, email, password].some(
        (v) => typeof v !== "string",
      )
    ) {
      throw new HttpError(400, "Todos los campos deben ser de tipo texto");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new HttpError(400, "El formato del email no es válido");
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new HttpError(
        400,
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }

    const existingUser = await this.repository.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new HttpError(409, "El email ya está registrado");
    }

    const hashedPassword = await createHash(password);

    try {
      const newUser = await this.repository.createUser({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      });

      return toPublicUser(newUser);
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpError(409, "El email ya está registrado");
      }
      throw error;
    }
  };

  login = async (body) => {
    const { email, password } = body ?? {};

    if ([email, password].some(isMissing)) {
      throw new HttpError(400, "Faltan campos obligatorios");
    }

    if ([email, password].some((v) => typeof v !== "string")) {
      throw new HttpError(400, "Todos los campos deben ser de tipo texto");
    }

    const user = await this.repository.getUserByEmail(
      email.trim().toLowerCase(),
    );

    const passwordMatches = user
      ? await isValidPassword(password, user.password)
      : false;
    if (!passwordMatches) {
      throw new HttpError(401, "Credenciales inválidas");
    }

    return generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });
  };
}

export const sessionsService = new SessionsService(usersRepository);

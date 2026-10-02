import { usersRepository } from "../repositories/users.repository.js";
import { createHash, isValidPassword } from "../utils/hash.js";
import { HttpError } from "../utils/httpError.js";

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isMissing = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "");

const withoutPassword = ({ password, ...user }) => user;

export default class UsersService {
  constructor(repository) {
    this.repository = repository;
  }

  register = async ({ first_name, last_name, email, password }) => {
    const fields = [first_name, last_name, email, password];

    if (fields.some(isMissing)) {
      throw new HttpError(400, "Faltan campos obligatorios");
    }

    if (fields.some((value) => typeof value !== "string")) {
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

    if (await this.repository.getUserByEmail(normalizedEmail)) {
      throw new HttpError(409, "El email ya está registrado");
    }

    try {
      const user = await this.repository.createUser({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: normalizedEmail,
        password: await createHash(password),
      });

      return withoutPassword(user);
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpError(409, "El email ya está registrado");
      }
      throw error;
    }
  };

  authenticate = async ({ email, password }) => {
    if ([email, password].some(isMissing)) {
      throw new HttpError(400, "Faltan campos obligatorios");
    }

    if ([email, password].some((value) => typeof value !== "string")) {
      throw new HttpError(400, "Todos los campos deben ser de tipo texto");
    }

    const user = await this.repository.getUserByEmail(
      email.trim().toLowerCase(),
    );
    const valid = user ? await isValidPassword(password, user.password) : false;

    if (!valid) {
      throw new HttpError(401, "Credenciales inválidas");
    }

    return withoutPassword(user);
  };

  getUsers = () => this.repository.getUsers();
}

export const usersService = new UsersService(usersRepository);

import UsersDAO from "../dao/users.dao.js";

export default class UsersRepository {
  constructor(dao) {
    this.dao = dao;
  }

  createUser = (userData) => this.dao.create(userData);

  getUserByEmail = (email) => this.dao.getByEmail(email);
}

export const usersRepository = new UsersRepository(new UsersDAO());

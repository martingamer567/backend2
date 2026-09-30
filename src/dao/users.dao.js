import User from "../models/User.js";

export default class UsersDAO {
  create = (userData) => User.create(userData);

  getByEmail = (email) => User.findOne({ email }).lean();
}

import User from "../models/User.js";

export default class UsersDAO {
  create = async (userData) => (await User.create(userData)).toObject();

  getByEmail = (email) => User.findOne({ email }).lean();

  getAll = () => User.find().select("-password").lean();
}

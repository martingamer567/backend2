import User from "../models/User.js";

export default class UsersDAO {
  create = async (userData) => (await User.create(userData)).toObject();

  getByEmail = (email) => User.findOne({ email }).lean();

  getById = (id) => User.findById(id).select("-password").lean();

  getAll = () => User.find().select("-password").lean();
}

import { usersRepository } from "../repositories/users.repository.js";

const toPublicUser = (user) => ({
  id: user._id.toString(),
  first_name: user.first_name,
  last_name: user.last_name,
  email: user.email,
  role: user.role,
});

export const getUsers = async (req, res) => {
  try {
    const users = await usersRepository.getUsers();
    return res
      .status(200)
      .json({ status: "success", payload: users.map(toPublicUser) });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Error interno del servidor" });
  }
};

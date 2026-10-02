import { usersService } from "../services/users.service.js";
import { UserDTO } from "../dto/user.dto.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUsers = asyncHandler(async (req, res) => {
  const users = await usersService.getUsers();
  return res.status(200).json({
    status: "success",
    payload: users.map((user) => new UserDTO(user)),
  });
});
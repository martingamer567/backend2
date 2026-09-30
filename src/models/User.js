import mongoose from 'mongoose';

// Roles posibles. El registro público nunca permite elegirlo.
export const USER_ROLES = ['user', 'organizer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    // unique crea un índice único en Mongo: segunda barrera contra emails repetidos
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Acá va SIEMPRE el hash de bcrypt, nunca la contraseña en texto plano
    password: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'user' },
  },
  { timestamps: true, versionKey: false },
);

const User = mongoose.model('User', userSchema);

export default User;
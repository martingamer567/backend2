import mongoose from 'mongoose';

export const connectDB = async (mongoUrl) => {
  if (!mongoUrl) {
    throw new Error('Falta la variable de entorno MONGO_URL');
  }

  await mongoose.connect(mongoUrl);
  console.log('Conectado a MongoDB');
};
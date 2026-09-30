import 'dotenv/config'; 
import app from './app.js';
import { config } from './config/config.js';
import { connectDB } from './config/db.js';

const start = async () => {
  try {
    await connectDB(config.mongoUrl);

    app.listen(config.port, () => {
      console.log(`Servidor escuchando en el puerto ${config.port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
};

start();
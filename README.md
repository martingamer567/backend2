# Proyecto Eventos - API REST

API REST para una plataforma de gestión de eventos y sesiones. Permite administrar eventos y las sesiones asociadas a cada uno (charlas, talleres, etc.), junto con los usuarios que participan de la plataforma.

**Temática elegida:** Plataforma de eventos (events & sessions).

Este repositorio corresponde a la **Pre-entrega 1**: estructura base del servidor Express organizada por capas, lista para escalar en las próximas entregas (persistencia en MongoDB, autenticación, lógica de negocio, etc.).

## Tecnologías

- Node.js
- Express
- dotenv
- Módulos ES (ESM)

## Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/martingamer567/backend2
   cd backend2
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

## Configuración de variables de entorno

Crear un archivo `.env` en la raíz del proyecto a partir de `.env.example`:

```bash
cp .env.example .env
```

Variables disponibles:

| Variable     | Descripción                                  | Ejemplo                              |
| ------------ | --------------------------------------------- | ------------------------------------- |
| `PORT`       | Puerto en el que se levanta el servidor       | `8080`                                |
| `NODE_ENV`   | Entorno de ejecución                          | `development`                         |
| `MONGO_URL`  | Cadena de conexión a MongoDB (uso futuro)     | `mongodb://localhost:27017/eventos`   |
| `JWT_SECRET` | Secreto para firmar tokens JWT (uso futuro)   | `un_secreto_seguro`                   |

## Cómo ejecutar

Modo desarrollo (con recarga automática ante cambios):

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

El servidor toma el puerto desde la variable de entorno `PORT` (por defecto `8080` si no está definida).

## Estructura de carpetas

```
proyecto-eventos-api/
├── src/
│   ├── app.js                     # Configura Express (middlewares y rutas)
│   ├── server.js                  # Levanta el servidor
│   ├── config/
│   │   └── config.js              # Lectura centralizada de variables de entorno
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/                  # Lógica de negocio (próximas entregas)
│   ├── repositories/              # Abstracción de acceso a datos (próximas entregas)
│   ├── dao/                       # Acceso a la base de datos (próximas entregas)
│   ├── models/
│   │   ├── User.js
│   │   └── Event.js
│   ├── middlewares/                # Middlewares personalizados (próximas entregas)
│   └── utils/                      # Utilidades varias (próximas entregas)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Rutas disponibles

| Método | Ruta           | Descripción                              |
| ------ | -------------- | ----------------------------------------- |
| GET    | `/api/health`  | Verifica que el servidor esté activo      |
| GET    | `/api/events`  | Lista de eventos (vacía en esta entrega)  |
| GET    | `/api/sessions`| Lista de sesiones (vacía en esta entrega) |

### Ejemplos de respuesta

`GET /api/health`

```json
{ "status": "ok", "message": "Servidor activo" }
```

`GET /api/events`

```json
{ "status": "success", "payload": [] }
```


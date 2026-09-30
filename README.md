# Proyecto Eventos - API REST

API REST para una plataforma de gestión de eventos y sesiones. Permite administrar eventos y las sesiones asociadas a cada uno (charlas, talleres, etc.), junto con los usuarios que participan de la plataforma.

**Temática elegida:** Plataforma de eventos (events & sessions).

Este repositorio corresponde a la **Pre-entrega 2**: sobre la estructura base por capas (Pre-entrega 1) se suma persistencia en MongoDB Atlas con Mongoose y el registro seguro de usuarios (contraseñas hasheadas con bcrypt).

## Tecnologías

- Node.js
- Express
- Mongoose
- MongoDB Atlas
- bcrypt
- dotenv
- Módulos ES (ESM)

## Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/martingamer567/backend2.git
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

El archivo `.env` real **no se sube al repositorio** (está excluido en `.gitignore`); cada quien debe crear el propio a partir de `.env.example` con sus credenciales.

Variables disponibles:

| Variable             | Descripción                                                    | Ejemplo                                                                          |
| --------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `PORT`                | Puerto en el que se levanta el servidor                        | `3000`                                                                             |
| `NODE_ENV`            | Entorno de ejecución                                            | `development`                                                                      |
| `MONGO_URL`           | Cadena de conexión a la base de datos en MongoDB Atlas          | `mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/eventos?retryWrites=true&w=majority` |
| `JWT_SECRET`          | Secreto para firmar tokens JWT (uso futuro)                     | `un_secreto_seguro`                                                                |
| `BCRYPT_SALT_ROUNDS`  | Rondas de sal para el hash de contraseñas con bcrypt (opcional, por defecto `10`) | `10`                                                              |

## Cómo ejecutar

Modo desarrollo (con recarga automática ante cambios):

```bash
npm run dev
```

Modo producción:

```bash
npm start
```

El servidor toma el puerto desde la variable de entorno `PORT` (por defecto `3000` si no está definida).

## Estructura de carpetas

```
proyecto-eventos-api/
├── src/
│   ├── app.js                        # Configura Express (middlewares y rutas)
│   ├── server.js                     # Conecta la base de datos y levanta el servidor
│   ├── config/
│   │   ├── config.js                 # Lectura centralizada de variables de entorno
│   │   └── db.js                     # Conexión a MongoDB (Mongoose)
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js
│   │   └── sessions.router.js        # GET / y POST /register
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/
│   │   └── sessions.service.js       # Lógica de negocio del registro de usuarios
│   ├── repositories/
│   │   └── users.repository.js       # Abstracción de acceso a datos de usuarios
│   ├── dao/
│   │   └── users.dao.js              # Acceso directo al modelo User (Mongoose)
│   ├── models/
│   │   ├── User.js                   # Esquema de Mongoose para usuarios
│   │   └── Event.js
│   ├── middlewares/                  # Middlewares personalizados (próximas entregas)
│   └── utils/
│       ├── hash.js                   # Hash y verificación de contraseñas con bcrypt
│       └── httpError.js              # Clase de error con statusCode para el flujo de la API
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Rutas disponibles

| Método | Ruta                     | Descripción                                    |
| ------ | ------------------------ | ----------------------------------------------- |
| GET    | `/api/health`            | Verifica que el servidor esté activo            |
| GET    | `/api/events`            | Lista de eventos (vacía en esta entrega)        |
| GET    | `/api/sessions`          | Lista de sesiones (vacía en esta entrega)       |
| POST   | `/api/sessions/register` | Registra un nuevo usuario con contraseña hasheada |

### Ejemplos de respuesta

`GET /api/health`

```json
{ "status": "ok", "message": "Servidor activo" }
```

`GET /api/events`

```json
{ "status": "success", "payload": [] }
```

## Registro de usuarios (POST /api/sessions/register)

### Body esperado (JSON)

| Campo        | Tipo   | Obligatorio |
| ------------ | ------ | ------------ |
| `first_name` | string | Sí           |
| `last_name`  | string | Sí           |
| `email`      | string | Sí           |
| `password`   | string | Sí           |

### Reglas de validación

- Los cuatro campos (`first_name`, `last_name`, `email`, `password`) son obligatorios y deben ser de tipo `string`.
- El `email` debe tener un formato válido y se normaliza (`trim` + `lowercase`) antes de validarlo y guardarlo.
- La `password` debe tener un mínimo de 8 caracteres.
- El `email` debe ser único: si ya existe un usuario registrado con ese email, se rechaza la petición.
- La `password` se guarda siempre hasheada con bcrypt (nunca en texto plano), usando `BCRYPT_SALT_ROUNDS` como cantidad de rondas.
- El `role` **no puede enviarse desde el body**: aunque se incluya en la petición, se ignora — el usuario siempre se crea con `role: "user"`.

### Ejemplo de request

Nota cómo el email se envía con mayúsculas y un espacio al final: la API lo normaliza antes de guardarlo.

```
POST /api/sessions/register
Content-Type: application/json

{
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "Ana@Mail.com ",
  "password": "Secreta123"
}
```

### Respuestas

**201 Created** — registro exitoso, con el email ya normalizado y sin el campo `password`:

```json
{
  "status": "success",
  "payload": {
    "id": "665f2a1e8f1b2c0012345678",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

**400 Bad Request** — campos faltantes:

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

**400 Bad Request** — email con formato inválido:

```json
{ "status": "error", "message": "El formato del email no es válido" }
```

**400 Bad Request** — contraseña corta:

```json
{ "status": "error", "message": "La contraseña debe tener al menos 8 caracteres" }
```

**409 Conflict** — email ya registrado:

```json
{ "status": "error", "message": "El email ya está registrado" }
```

### Cómo probarlo

**Con curl:**

```bash
curl -X POST http://localhost:3000/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Pérez","email":"Ana@Mail.com ","password":"Secreta123"}'
```

**Con Postman / Thunder Client:**

1. Método `POST` a `http://localhost:3000/api/sessions/register`.
2. Header `Content-Type: application/json`.
3. Body tipo `raw` / `JSON` con `first_name`, `last_name`, `email` y `password`.
4. Enviar y verificar que la respuesta sea `201` con el `payload` sin el campo `password`.

**Verificar en MongoDB Atlas:**

1. Entrar al cluster en Atlas y abrir **Data Explorer** (Browse Collections).
2. Ubicar la base `eventos` y la colección `users`.
3. Abrir el documento recién creado y confirmar que el campo `password` es un hash de bcrypt (empieza con `$2b$`) y no la contraseña en texto plano.

### Casos de prueba

- Registro exitoso con los 4 campos válidos → `201` con el usuario creado.
- Campos faltantes → `400` con `"Faltan campos obligatorios"`.
- Email con formato inválido → `400` con `"El formato del email no es válido"`.
- Email duplicado → `409` con `"El email ya está registrado"`.
- La contraseña queda hasheada en la base de datos (verificable en MongoDB Atlas, valor que empieza con `$2b$`).
- La respuesta `201` nunca incluye el campo `password`.


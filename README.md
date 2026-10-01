# Proyecto Eventos - API REST

API REST para una plataforma de gestión de eventos y sesiones. Permite administrar eventos y las sesiones asociadas a cada uno (charlas, talleres, etc.), junto con los usuarios que participan de la plataforma.

**Temática elegida:** Plataforma de eventos (events & sessions).

Este repositorio corresponde a la **Pre-entrega 3**: sobre el registro seguro de usuarios (Pre-entrega 2) se suma la autenticación con JWT guardado en una cookie `httpOnly`: login, ruta protegida `/current` y logout.

## Tecnologías

- Node.js
- Express
- Mongoose
- MongoDB Atlas
- bcrypt
- jsonwebtoken
- cookie-parser
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

El archivo `.env` real **no se sube al repositorio** (está excluido en `.gitignore`); cada quien debe crear el propio con sus credenciales.

| Variable             | Descripción                                                          | Ejemplo                                                                                          |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `PORT`               | Puerto en el que se levanta el servidor                              | `3000`                                                                                           |
| `NODE_ENV`           | Entorno de ejecución (con `production` la cookie se marca `secure`)  | `development`                                                                                    |
| `MONGO_URL`          | Cadena de conexión a la base de datos en MongoDB Atlas               | `mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/eventos?retryWrites=true&w=majority`   |
| `JWT_SECRET`         | Secreto con el que se firman los JWT (obligatorio, nunca va en el código) | `una_cadena_larga_y_aleatoria`                                                              |
| `JWT_EXPIRES_IN`     | Tiempo de vida del token JWT (por defecto `1h`)                      | `1h`                                                                                             |
| `BCRYPT_SALT_ROUNDS` | Rondas de sal para el hash de contraseñas (opcional, por defecto `10`) | `10`                                                                                           |

## Cómo ejecutar

Modo desarrollo (con recarga automática ante cambios en el código; si cambiás el `.env` hay que reiniciar):

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
backend2/
├── src/
│   ├── app.js                        # Configura Express (middlewares y rutas)
│   ├── server.js                     # Conecta la base de datos y levanta el servidor
│   ├── config/
│   │   ├── config.js                 # Lectura centralizada de variables de entorno
│   │   └── db.js                     # Conexión a MongoDB (Mongoose)
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js
│   │   └── sessions.router.js        # register, login, current y logout
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   └── sessions.controller.js    # Respuestas HTTP y manejo de la cookie
│   ├── services/
│   │   └── sessions.service.js       # Reglas de negocio: registro y login
│   ├── repositories/
│   │   └── users.repository.js       # Abstracción de acceso a datos de usuarios
│   ├── dao/
│   │   └── users.dao.js              # Acceso directo al modelo User (Mongoose)
│   ├── models/
│   │   ├── User.js                   # Esquema de Mongoose para usuarios
│   │   └── Event.js
│   ├── middlewares/
│   │   └── auth.middleware.js        # Protege rutas: verifica el JWT de la cookie
│   └── utils/
│       ├── hash.js                   # Hash y verificación de contraseñas (bcrypt)
│       ├── jwt.js                    # Firma y verificación de JWT
│       └── httpError.js              # Error con statusCode para el flujo de la API
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Rutas disponibles

| Método | Ruta                     | Descripción                                          | Requiere sesión |
| ------ | ------------------------ | ---------------------------------------------------- | --------------- |
| GET    | `/api/health`            | Verifica que el servidor esté activo                 | No              |
| GET    | `/api/events`            | Lista de eventos (vacía por ahora)                   | No              |
| GET    | `/api/sessions`          | Lista de sesiones (vacía por ahora)                  | No              |
| POST   | `/api/sessions/register` | Registra un usuario nuevo con contraseña hasheada    | No              |
| POST   | `/api/sessions/login`    | Inicia sesión y guarda el JWT en la cookie `currentUser` | No          |
| GET    | `/api/sessions/current`  | Devuelve los datos del usuario autenticado           | **Sí**          |
| POST   | `/api/sessions/logout`   | Cierra sesión (elimina la cookie `currentUser`)      | No              |

### GET /api/health

Respuesta `200`:

```json
{ "status": "ok", "message": "Servidor activo" }
```

### GET /api/events

Respuesta `200`:

```json
{ "status": "success", "payload": [] }
```

### GET /api/sessions

Respuesta `200`:

```json
{ "status": "success", "payload": [] }
```

### POST /api/sessions/register

Body (JSON), todos los campos son obligatorios y de tipo `string`:

```json
{ "first_name": "Ana", "last_name": "Perez", "email": "Ana@Mail.com ", "password": "Secreta123" }
```

Reglas: el email debe tener formato válido y se normaliza (`trim` + `lowercase`); la contraseña debe tener al menos 8 caracteres y se guarda hasheada con bcrypt; el email debe ser único; el `role` **no puede enviarse en el body** (el usuario siempre se crea con `role: "user"`).

Respuesta `201` (nunca incluye `password`):

```json
{
  "status": "success",
  "payload": { "id": "665f2a...", "first_name": "Ana", "last_name": "Perez", "email": "ana@mail.com", "role": "user" }
}
```

Respuesta `400` (campos faltantes, email inválido o contraseña corta):

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

Respuesta `409` (email ya registrado):

```json
{ "status": "error", "message": "El email ya está registrado" }
```

### POST /api/sessions/login

Body (JSON):

```json
{ "email": "ana@mail.com", "password": "Secreta123" }
```

Si las credenciales son correctas, se genera un JWT con payload `{ id, email, role }` (firmado con `JWT_SECRET`, con la expiración de `JWT_EXPIRES_IN`) y se guarda en la cookie `currentUser` con `httpOnly: true`, `sameSite: 'lax'`, `maxAge: 3600000` y `secure: true` solo en producción. El token **no** viaja en el body.

Respuesta `200` (además setea la cookie `currentUser`):

```json
{ "status": "success", "message": "Login correcto" }
```

Respuesta `400` (falta `email` o `password`):

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

Respuesta `401` (email inexistente o contraseña incorrecta; el mensaje es siempre el mismo y no indica qué falló):

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

### GET /api/sessions/current

Ruta protegida: el middleware `auth` lee la cookie `currentUser`, verifica el JWT y guarda el payload en `req.user`.

Respuesta `200` (con la cookie):

```json
{ "status": "success", "payload": { "id": "665f2a...", "email": "ana@mail.com", "role": "user" } }
```

Respuesta `401` (sin cookie, o con token inválido o expirado):

```json
{ "status": "error", "message": "No autenticado" }
```

### POST /api/sessions/logout

Elimina la cookie `currentUser`. Respuesta `200`:

```json
{ "status": "success", "message": "Sesión cerrada" }
```

## Cómo probar los endpoints

**Con curl** (el parámetro `-c` guarda la cookie en un archivo y `-b` la envía):

```bash
# Registro
curl -X POST http://localhost:3000/api/sessions/register \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Ana","last_name":"Perez","email":"ana@mail.com","password":"Secreta123"}'

# Login (guarda la cookie)
curl -X POST http://localhost:3000/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@mail.com","password":"Secreta123"}' -c ~/cookies.txt

# Ruta protegida (envía la cookie)
curl http://localhost:3000/api/sessions/current -b ~/cookies.txt

# Logout
curl -X POST http://localhost:3000/api/sessions/logout -b ~/cookies.txt -c ~/cookies.txt
```

**Con Postman / Thunder Client:** hacer el `POST` al login con el body JSON; el cliente guarda la cookie `currentUser` automáticamente y la envía en los pedidos siguientes a `/current`.

**Verificar el hash en MongoDB Atlas:** en *Data Explorer*, base `eventos`, colección `users`, el campo `password` de cada usuario es un hash de bcrypt (empieza con `$2b$`) y nunca la contraseña en texto plano.

### Casos de prueba

- Registro exitoso → login → `/current` → logout → `/current` devuelve `401`.
- Login con email inexistente → `401` "Credenciales inválidas".
- Login con contraseña incorrecta → `401` "Credenciales inválidas" (mismo mensaje).
- `/current` sin cookie → `401`.
- `/current` con token manipulado o expirado → `401`.
- Registro: campos faltantes, email inválido y email duplicado devuelven `400`, `400` y `409`.
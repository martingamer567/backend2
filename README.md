# Proyecto Eventos - API REST

API REST para una plataforma de gestión de eventos y sesiones. Permite administrar eventos y las sesiones asociadas a cada uno (charlas, talleres, etc.), junto con los usuarios que participan de la plataforma.

**Temática elegida:** Plataforma de eventos (events & sessions).

Este repositorio corresponde a la **Pre-entrega 6**: sobre la autenticación con Passport.js y JWT (Pre-entrega 3 y 4) y los roles y autorización (Pre-entrega 5), se completa la **entidad `events` con su lógica de negocio**: CRUD completo, validaciones de negocio, control por rol y por propiedad del recurso, y un listado con filtros, paginación y ordenamiento.

## Tecnologías

- Node.js
- Express
- Mongoose
- MongoDB Atlas
- bcrypt
- jsonwebtoken
- cookie-parser
- passport, passport-local y passport-jwt
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
│   ├── app.js                        # Configura Express (middlewares, Passport y rutas)
│   ├── server.js                     # Conecta la base de datos y levanta el servidor
│   ├── config/
│   │   ├── config.js                 # Lectura centralizada de variables de entorno
│   │   ├── db.js                     # Conexión a MongoDB (Mongoose)
│   │   ├── passport.config.js        # Estrategias de Passport: register, login y current
│   │   └── roles.js                  # Roles y matriz de permisos
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js          # Eventos: aplica auth + authorize en las rutas protegidas
│   │   ├── sessions.router.js        # register, login, current y logout
│   │   └── users.router.js           # Ruta administrativa: listado de usuarios
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   ├── sessions.controller.js    # Respuestas HTTP, generación del JWT y cookie
│   │   └── users.controller.js
│   ├── services/
│   │   └── events.service.js         # Reglas de negocio de eventos (validaciones, estados, propiedad, filtros)
│   ├── repositories/
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/
│   │   ├── events.dao.js             # Acceso directo al modelo Event (Mongoose)
│   │   └── users.dao.js              # Acceso directo al modelo User (Mongoose)
│   ├── models/
│   │   ├── User.js                   # Esquema de usuarios (campo role)
│   │   └── Event.js                  # Esquema de eventos (campo organizer y status)
│   ├── middlewares/
│   │   ├── auth.middleware.js        # Autenticación: valida el JWT de la cookie -> 401
│   │   ├── authorize.middleware.js   # Autorización: compara el rol con los permitidos -> 403
│   │   └── passportCall.js           # Envuelve passport.authenticate (mantiene status y mensajes)
│   └── utils/
│       ├── hash.js                   # Hash y verificación de contraseñas (bcrypt)
│       ├── jwt.js                    # Firma de JWT
│       └── httpError.js              # Error con statusCode para el flujo de la API
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Estrategias de Passport

Toda la autenticación está centralizada en `src/config/passport.config.js`.
`app.js` solo llama a `initializePassport()` y `passport.initialize()`.

| Estrategia | Tipo | Qué hace |
| ---------- | ---- | -------- |
| `register` | passport-local | Valida los datos, normaliza el email, verifica que no exista, hashea la contraseña con bcrypt y crea el usuario con rol `user` por defecto. |
| `login`    | passport-local | Valida las credenciales. Ante cualquier fallo de autenticación responde con el mismo mensaje genérico "Credenciales inválidas". |
| `current`  | passport-jwt   | Lee el JWT desde la cookie `currentUser`, lo valida y deja `{ id, email, role }` en `req.user`. |

- Las estrategias no generan el token: tras un login exitoso, el controller genera el JWT y setea la cookie `currentUser` (`httpOnly`).
- `POST /api/sessions/logout` elimina la cookie y no pasa por Passport.
- El middleware `passportCall` (`src/middlewares/passportCall.js`) envuelve `passport.authenticate` para mantener los status y mensajes de la API.

### Preparado para providers externos

El sistema queda preparado para sumar providers externos (Google, GitHub, etc.): alcanza con definir la nueva estrategia en `passport.config.js` y registrarla en `initializePassport()`, sin tocar `app.js`.

## Roles y autorización

### Roles

El modelo `User` tiene el campo `role` con tres valores posibles: `user`, `organizer` y `admin` (por defecto `user`). Los roles y la matriz de permisos están definidos en un único lugar: `src/config/roles.js`.

- **El registro público siempre crea usuarios con rol `user`.** Si el body incluye un `role` (por ejemplo `"admin"` u `"organizer"`), se ignora.
- Los roles `organizer` y `admin` se asignan fuera de la API, modificando el campo `role` del usuario directamente en la base de datos (por ejemplo desde el *Data Explorer* de MongoDB Atlas).
- El rol viaja dentro del JWT: después de cambiar el rol de un usuario, ese usuario tiene que **volver a iniciar sesión** para que su token lo refleje.

### Matriz de permisos

| Acción                              | user | organizer | admin |
| ----------------------------------- | :--: | :-------: | :---: |
| Consultar eventos publicados        |  ✅  |    ✅     |  ✅   |
| Crear eventos                       |  ❌  |    ✅     |  ✅   |
| Modificar/cancelar eventos propios  |  ❌  |    ✅     |  ✅   |
| Modificar cualquier evento          |  ❌  |    ❌     |  ✅   |
| Ver todos los usuarios              |  ❌  |    ❌     |  ✅   |

### Middlewares

Ambos son reutilizables y están separados del código de las rutas:

- **`auth`** (`src/middlewares/auth.middleware.js`): lee el JWT desde la cookie `currentUser` (estrategia `current` de Passport), lo valida y puebla `req.user`. Si no hay sesión válida responde `401`.
- **`authorize(...roles)`** (`src/middlewares/authorize.middleware.js`): recibe los roles permitidos y los compara contra `req.user.role`. Si no coincide responde `403`. Se usa siempre después de `auth`.

Ejemplo de uso en una ruta:

```js
router.post("/", auth, authorize(...PERMISSIONS.createEvents), createEvent);
```

### Propiedad de los recursos

Para modificar o cambiar el estado de un evento, además del rol se valida la propiedad dentro de `events.service.js`: un `organizer` solo puede modificar o cambiar el estado de los eventos que él creó (`event.organizer`), mientras que un `admin` puede hacerlo con cualquiera. El `organizer` de un evento siempre sale del token del usuario que lo crea, nunca del body.

### Diferencia entre 401 y 403

| Código | Significa | Cuándo ocurre | Respuesta |
| ------ | --------- | ------------- | --------- |
| `401 Unauthorized` | **No hay sesión**: el usuario no está autenticado | No hay cookie `currentUser`, o el token es inválido, manipulado o expiró | `{ "status": "error", "message": "No autenticado" }` |
| `403 Forbidden` | **Hay sesión pero no hay permiso**: el usuario está autenticado pero su rol no alcanza | El rol no está entre los permitidos, o un `organizer` intenta modificar un evento ajeno | `{ "status": "error", "message": "No tenés permisos para realizar esta acción" }` |

En ningún caso se usa `500` para estas situaciones.

### Rutas protegidas

| Método | Ruta                          | Quién puede acceder        |
| ------ | ----------------------------- | -------------------------- |
| GET    | `/api/sessions/current`       | Cualquier usuario autenticado |
| POST   | `/api/events`                 | `organizer` y `admin`      |
| PUT    | `/api/events/:id`             | `organizer` (solo sus eventos) y `admin` (cualquiera) |
| PATCH  | `/api/events/:id/status`      | `organizer` (solo sus eventos) y `admin` (cualquiera) |
| GET    | `/api/users`                  | Solo `admin` (ruta administrativa) |

## Rutas disponibles

| Método | Ruta                     | Descripción                                          | Requiere sesión | Roles |
| ------ | ------------------------ | ---------------------------------------------------- | --------------- | ----- |
| GET    | `/api/health`            | Verifica que el servidor esté activo                 | No              | -     |
| GET    | `/api/events`            | Lista eventos con filtros, paginación y orden        | No              | -     |
| GET    | `/api/events/:id`        | Detalle de un evento (los borradores no son públicos) | No             | -     |
| POST   | `/api/events`            | Crea un evento                                       | **Sí**          | organizer, admin |
| PUT    | `/api/events/:id`        | Modifica un evento                                   | **Sí**          | organizer (propios), admin |
| PATCH  | `/api/events/:id/status` | Cambia el estado de un evento (incluye cancelar)     | **Sí**          | organizer (propios), admin |
| GET    | `/api/users`             | Lista todos los usuarios (sin `password`)            | **Sí**          | admin |
| GET    | `/api/sessions`          | Lista de sesiones (vacía por ahora)                  | No              | -     |
| POST   | `/api/sessions/register` | Registra un usuario nuevo (estrategia `register`)    | No              | -     |
| POST   | `/api/sessions/login`    | Inicia sesión (estrategia `login`) y guarda el JWT en la cookie `currentUser` | No | - |
| GET    | `/api/sessions/current`  | Devuelve los datos del usuario autenticado           | **Sí**          | cualquiera |
| POST   | `/api/sessions/logout`   | Cierra sesión (elimina la cookie `currentUser`)      | No              | -     |

### GET /api/health

Respuesta `200`:

```json
{ "status": "ok", "message": "Servidor activo" }
```

## Entidad Event y reglas de negocio

### Modelo

| Campo         | Tipo     | Reglas |
| ------------- | -------- | ------ |
| `title`       | String   | Obligatorio |
| `description` | String   | Obligatorio |
| `category`    | String   | Obligatorio |
| `date`        | Date     | Obligatorio, no puede ser pasada al crear |
| `location`    | String   | Obligatorio |
| `capacity`    | Number   | Obligatorio, entero mayor que 0 |
| `price`       | Number   | Obligatorio, mayor o igual a 0 |
| `status`      | String   | `draft`, `published`, `cancelled` o `finished` (por defecto `published`) |
| `organizer`   | ObjectId | Referencia a `User`; siempre sale del token, nunca del body |

### Reglas de negocio

- La fecha de un evento no puede ser pasada al crearlo (`400`).
- La capacidad debe ser un entero mayor que 0 (`400`).
- El precio debe ser mayor o igual a 0 (`400`).
- Solo `organizer` y `admin` crean eventos; el `organizer` es el usuario autenticado.
- Un `organizer` solo modifica o cambia el estado de sus eventos; un `admin` puede con cualquiera (`403` en caso contrario).
- Un evento `cancelled` no puede modificarse ni cambiar de estado (`409`).
- Al crear, el estado solo puede ser `draft` o `published`.
- Los borradores (`draft`) no son públicos: no aparecen en el listado y el detalle devuelve `404`.

### Transiciones de estado

| Estado actual | Estados permitidos |
| ------------- | ------------------ |
| `draft`       | `published`, `cancelled` |
| `published`   | `cancelled`, `finished` |
| `cancelled`   | ninguno |
| `finished`    | ninguno |

Cualquier otra transición responde `409`. Publicar un evento `finished` responde `409` con `"No se puede publicar un evento finalizado"`.

### GET /api/events

Público. Query params opcionales:

| Parámetro  | Descripción | Por defecto |
| ---------- | ----------- | ----------- |
| `status`   | `published`, `cancelled`, `finished` (`draft` devuelve vacío) | `published` |
| `category` | Coincidencia exacta, sin distinguir mayúsculas | - |
| `location` | Coincidencia exacta, sin distinguir mayúsculas | - |
| `dateFrom` | Eventos desde esa fecha (ISO) | - |
| `dateTo`   | Eventos hasta esa fecha; si es solo fecha (`2026-11-30`) incluye todo ese día | - |
| `page`     | Número de página (entero >= 1) | `1` |
| `limit`    | Resultados por página (1 a 100) | `10` |
| `sort`     | `date`, `price`, `title` o `createdAt`; con `-` delante es descendente (`-price`) | `date` |

Ejemplo: `GET /api/events?status=published&category=workshop&page=2&limit=5`

Respuesta `200`:

```json
{
  "status": "success",
  "data": [
    {
      "id": "6abf...",
      "title": "Workshop 6",
      "description": "d",
      "category": "workshop",
      "date": "2026-11-07T18:00:00.000Z",
      "location": "Cordoba",
      "capacity": 20,
      "price": 600,
      "status": "published",
      "organizer": "6abe..."
    }
  ],
  "page": 2,
  "limit": 5,
  "total": 6,
  "totalPages": 2
}
```

Respuesta `400` ante parámetros inválidos (`limit` fuera de rango, `status` desconocido, `sort` no permitido, fecha inválida o `dateFrom` posterior a `dateTo`), por ejemplo:

```json
{ "status": "error", "message": "limit debe estar entre 1 y 100" }
```

### GET /api/events/:id

Público. `200` con el evento en `payload`; `400` si el id no es válido; `404` si no existe o es un borrador.

### POST /api/events

Requiere sesión y rol `organizer` o `admin`. Body (JSON): `title`, `description`, `category`, `date` y `location` (string, fecha en formato ISO), `capacity` y `price` (number). Opcional: `status` (`draft` o `published`).

```json
{
  "title": "Taller Node",
  "description": "Intro a Node",
  "category": "workshop",
  "date": "2026-11-01T18:00:00Z",
  "location": "Cordoba",
  "capacity": 30,
  "price": 1500
}
```

- `201`: devuelve el evento creado (`payload`).
- `400`: faltan campos, tipos inválidos, fecha inválida o pasada, capacidad o precio inválidos.
- `401`: sin sesión. `403`: rol `user`.

### PUT /api/events/:id

Requiere sesión y rol `organizer` (solo sus eventos) o `admin`. Modificación parcial: body con al menos uno de `title`, `description`, `category`, `date`, `location`, `capacity`, `price`.

```json
{ "title": "Taller Node v2", "price": 2000 }
```

- `200`: devuelve el evento actualizado.
- `400`: id inválido, campos inválidos o body sin campos (`"No hay campos para actualizar"`).
- `401`: sin sesión. `403`: sin permiso o evento ajeno. `404`: no existe.
- `409`: el evento está cancelado.

### PATCH /api/events/:id/status

Mismos permisos que `PUT`. Cambia el estado respetando la tabla de transiciones. Reemplaza al antiguo `/cancel`: para cancelar se envía `cancelled`.

```json
{ "status": "cancelled" }
```

- `200`: devuelve el evento con el nuevo estado.
- `400`: id inválido, falta `status` o valor no válido.
- `401`, `403`, `404`: igual que en `PUT`.
- `409`: transición no permitida o evento cancelado.

### GET /api/users

Ruta administrativa: solo `admin`. Nunca incluye `password`. Respuesta `200`:

```json
{
  "status": "success",
  "payload": [
    { "id": "665f2a...", "first_name": "Ana", "last_name": "Perez", "email": "ana@mail.com", "role": "user" }
  ]
}
```

Respuesta `401` (sin sesión) y `403` (rol distinto de `admin`), con los mensajes descriptos en la sección de 401 y 403.

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

Reglas (se validan dentro de la estrategia `register`): el email debe tener formato válido y se normaliza (`trim` + `lowercase`); la contraseña debe tener al menos 8 caracteres y se guarda hasheada con bcrypt; el email debe ser único; el `role` **no puede enviarse en el body** (el usuario siempre se crea con `role: "user"`).

Respuesta `201` (nunca incluye `password`):

```json
{
  "status": "success",
  "payload": { "id": "665f2a...", "first_name": "Ana", "last_name": "Perez", "email": "ana@mail.com", "role": "user" }
}
```

Respuesta `400` (campos faltantes, campos que no son texto, email inválido o contraseña corta), por ejemplo:

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

La estrategia `login` valida las credenciales. Si son correctas, el controller genera un JWT con payload `{ id, email, role }` (firmado con `JWT_SECRET`, con la expiración de `JWT_EXPIRES_IN`) y lo guarda en la cookie `currentUser` con `httpOnly: true`, `sameSite: 'lax'`, `maxAge: 3600000` y `secure: true` solo en producción. El token **no** viaja en el body.

Respuesta `200` (además setea la cookie `currentUser`):

```json
{ "status": "success", "message": "Login correcto" }
```

Respuesta `400` (falta `email` o `password`, o no son texto):

```json
{ "status": "error", "message": "Faltan campos obligatorios" }
```

Respuesta `401` (email inexistente o contraseña incorrecta; el mensaje es siempre el mismo y no indica qué falló):

```json
{ "status": "error", "message": "Credenciales inválidas" }
```

### GET /api/sessions/current

Ruta protegida: usa el middleware `auth`, que lee la cookie `currentUser`, valida el JWT y deja el usuario (`{ id, email, role }`) en `req.user`.

Respuesta `200` (con la cookie):

```json
{ "status": "success", "payload": { "id": "665f2a...", "email": "ana@mail.com", "role": "user" } }
```

Respuesta `401` (sin cookie, o con token inválido o expirado):

```json
{ "status": "error", "message": "No autenticado" }
```

### POST /api/sessions/logout

Elimina la cookie `currentUser` (no pasa por Passport). Respuesta `200`:

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

# Crear un evento (requiere rol organizer o admin)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" -b ~/cookies.txt \
  -d '{"title":"Taller Node","description":"Intro a Node","category":"workshop","date":"2026-12-01T18:00:00Z","location":"Cordoba","capacity":30,"price":1500}'

# Listado con filtros y paginación
curl "http://localhost:3000/api/events?status=published&category=workshop&page=1&limit=5"

# Ruta administrativa (requiere rol admin)
curl http://localhost:3000/api/users -b ~/cookies.txt

# Logout
curl -X POST http://localhost:3000/api/sessions/logout -b ~/cookies.txt -c ~/cookies.txt
```

**Con Postman / Thunder Client:** hacer el `POST` al login con el body JSON; el cliente guarda la cookie `currentUser` automáticamente y la envía en los pedidos siguientes.

**Probar los distintos roles:** registrar los usuarios por la API (todos nacen con rol `user`), cambiar el campo `role` de algunos a `organizer` y `admin` directamente en MongoDB Atlas y volver a iniciar sesión con cada uno (el rol viaja dentro del token).

**Verificar el hash en MongoDB Atlas:** en *Data Explorer*, base `eventos`, colección `users`, el campo `password` de cada usuario es un hash de bcrypt (empieza con `$2b$`) y nunca la contraseña en texto plano.

### Casos de prueba

Autenticación y roles:

- Cualquier ruta privada sin cookie → `401`.
- `POST /api/events` con rol `user` → `403`; con `organizer` → `201`.
- `GET /api/users` con `organizer` → `403`; con `admin` → `200`.
- Registro → login → `/current` → logout → `/current` devuelve `401`.
- Registro con email duplicado → `409`; login inválido → `401`.
- Registro con `role: "admin"` en el body → se ignora (rol `user`).

Eventos (Pre-entrega 6):

- Crear con fecha pasada → `400`; con `capacity: 0` → `400`; con `price` negativo → `400`.
- `organizer` edita un evento propio → `200`; edita uno ajeno → `403`; `admin` edita el de otro organizer → `200`.
- Id inválido → `400`; id inexistente → `404`.
- Cancelar un evento → `200`; cambiar el estado o editar un evento cancelado → `409`.
- `GET /api/events?status=published&category=workshop&page=2&limit=5` → `200` con `data`, `page`, `limit`, `total` y `totalPages`.
- `GET /api/events?sort=-price` ordena por precio descendente.
- `GET /api/events?limit=101` → `400`; `status` inválido → `400`.
- Los borradores no aparecen en el listado ni en `GET /api/events/:id`.
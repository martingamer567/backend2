# Proyecto Eventos - API REST

API REST para una plataforma de gestión de eventos y sesiones. Permite administrar eventos y las sesiones asociadas a cada uno (charlas, talleres, etc.), junto con los usuarios que participan de la plataforma.

**Temática elegida:** Plataforma de eventos (events & sessions).

Este repositorio corresponde a la **Pre-entrega 8**: refactor de toda la API a una **arquitectura profesional en capas** (rutas → controllers → services → repositories → DAOs), con **DTOs** para todas las respuestas sensibles y un **manejo de errores centralizado**, sin cambiar el comportamiento externo de ningún endpoint (sesiones, eventos y tickets responden igual que antes).

## Tecnologías

- Node.js
- Express
- Mongoose
- MongoDB Atlas
- bcrypt
- jsonwebtoken
- cookie-parser
- nodemailer
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
| `MAIL_HOST`          | Servidor SMTP para el envío de emails                                | `smtp.gmail.com`                                                                                 |
| `MAIL_PORT`          | Puerto SMTP (587 usa STARTTLS; 465 usa SSL)                          | `587`                                                                                            |
| `MAIL_USER`          | Usuario/cuenta con la que se autentica el SMTP                       | `tu_mail@gmail.com`                                                                              |
| `MAIL_PASS`          | Contraseña del SMTP (en Gmail, una *contraseña de aplicación*)       | `contraseña_de_aplicacion_de_16_letras`                                                          |
| `MAIL_FROM`          | Remitente que se muestra en los emails                               | `"Plataforma de Eventos <tu_mail@gmail.com>"`                                                    |
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
│   │   ├── constants.js              # Estados de eventos y tickets (compartidos por models, DAOs y services)
│   │   ├── db.js                     # Conexión a MongoDB (Mongoose)
│   │   ├── passport.config.js        # Estrategias de Passport: delegan en users.service
│   │   └── roles.js                  # Roles y matriz de permisos
│   ├── routes/
│   │   ├── health.router.js
│   │   ├── events.router.js          # Eventos: aplica auth + authorize en las rutas protegidas
│   │   ├── sessions.router.js        # register, login, current y logout
│   │   ├── tickets.router.js         # Tickets: mis tickets y cancelación
│   │   └── users.router.js           # Ruta administrativa: listado de usuarios
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── events.controller.js
│   │   ├── sessions.controller.js    # Respuestas HTTP, generación del JWT y cookie
│   │   ├── tickets.controller.js
│   │   └── users.controller.js       # Los controllers solo coordinan request/response y aplican el DTO
│   ├── services/
│   │   ├── events.service.js         # Reglas de negocio de eventos (validaciones, estados, propiedad, filtros)
│   │   ├── tickets.service.js        # Reglas de inscripción: validaciones, cupos, duplicados, cancelación y email
│   │   └── users.service.js          # Registro y autenticación de usuarios (validaciones, hash, duplicados)
│   ├── repositories/
│   │   ├── events.repository.js
│   │   ├── tickets.repository.js
│   │   └── users.repository.js
│   ├── dto/
│   │   ├── user.dto.js               # UserDTO y CurrentUserDTO (nunca incluyen password)
│   │   ├── event.dto.js              # EventDTO
│   │   └── ticket.dto.js             # TicketDTO (filtra los datos de event y user populados)
│   ├── dao/
│   │   ├── events.dao.js             # Acceso directo al modelo Event (Mongoose)
│   │   ├── tickets.dao.js            # Acceso directo al modelo Ticket (incluye el cálculo de cupos ocupados)
│   │   └── users.dao.js              # Acceso directo al modelo User (Mongoose)
│   ├── models/
│   │   ├── User.js                   # Esquema de usuarios (campo role)
│   │   ├── Event.js                  # Esquema de eventos (campo organizer y status)
│   │   └── Ticket.js                 # Esquema de tickets (referencias a user y event, status, reservationCode)
│   ├── middlewares/
│   │   ├── auth.middleware.js        # Autenticación: valida el JWT de la cookie -> 401
│   │   ├── authorize.middleware.js   # Autorización: compara el rol con los permitidos -> 403
│   │   ├── error.middleware.js       # Manejo centralizado de errores y ruta inexistente (404)
│   │   └── passportCall.js           # Envuelve passport.authenticate (mantiene status y mensajes)
│   └── utils/
│       ├── asyncHandler.js           # Envía los errores de handlers async al middleware de errores
│       ├── hash.js                   # Hash y verificación de contraseñas (bcrypt)
│       ├── jwt.js                    # Firma de JWT
│       ├── mailer.js                 # Envío de emails con Nodemailer
│       └── httpError.js              # Error con statusCode para el flujo de la API
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Arquitectura en capas

Cada request atraviesa las mismas capas, y cada capa solo conoce a la que tiene debajo:

```
Request → Router → Middlewares (auth / authorize) → Controller → Service → Repository → DAO → Modelo (MongoDB)
                                                        │
Response ← DTO ←────────────────────────────────────────┘          (los errores van al middleware de errores)
```

| Capa | Dónde | Responsabilidad | Qué NO hace |
| ---- | ----- | --------------- | ----------- |
| **Router** | `src/routes` | Define los endpoints y encadena `auth` y `authorize` | No tiene lógica |
| **Controller** | `src/controllers` | Extrae datos de `body`, `params` y `query`, llama al service, aplica el DTO y devuelve la respuesta | No valida, no calcula cupos, no resuelve reglas de negocio, no importa modelos |
| **Service** | `src/services` | **Toda la lógica de negocio**: validaciones, estados, cupos, duplicados, permisos sobre recursos propios y envío de email | No importa DAOs ni modelos: solo usa repositories |
| **Repository** | `src/repositories` | Expone operaciones orientadas al dominio (`getUserByEmail`, `findEvents`, `getActiveTicket`, `countReservedSeats`, `cancelTicket`) y traduce criterios del dominio a consultas | No importa modelos: solo usa su DAO |
| **DAO** | `src/dao` | Acceso directo a los datos con Mongoose (`create`, `getById`, `update`, `count`, `findPaginated`, etc.) | Son los únicos archivos que importan los modelos |
| **Modelo** | `src/models` | Esquemas de Mongoose | - |
| **DTO** | `src/dto` | Define qué datos salen en cada respuesta | Nunca expone `password` |

Reglas que se respetan en todo el código:

- Los controllers y los services **no importan modelos de Mongoose**. Las constantes compartidas (estados de eventos y tickets) viven en `src/config/constants.js`.
- Los services reciben su repository por constructor (inyección de dependencias), lo que permite reemplazarlo por uno falso en pruebas.
- El service de eventos solo valida y normaliza los filtros del listado; el repository los traduce al filtro de MongoDB.

### DTOs

Ninguna respuesta de la API sale directo del documento de la base de datos: pasa por un DTO que define los campos públicos.

| DTO | Se usa en | Campos |
| --- | --------- | ------ |
| `CurrentUserDTO` | `GET /api/sessions/current` y payload del JWT | `id`, `email`, `role` |
| `UserDTO` | Registro y `GET /api/users` | `id`, `first_name`, `last_name`, `email`, `role` |
| `EventDTO` | Todas las respuestas de eventos | `id`, `title`, `description`, `category`, `date`, `location`, `capacity`, `price`, `status`, `organizer` |
| `TicketDTO` | Todas las respuestas de tickets | `id`, `status`, `quantity`, `reservationCode`, `createdAt`, `cancelledAt`, `event`, `user` |

Con `populate`, el `TicketDTO` también filtra el documento relacionado: del evento solo expone `id`, `title`, `date` y `location`, y del usuario solo `id`, `first_name`, `last_name` y `email`. **Ninguna respuesta incluye `password`, ni siquiera hasheada**; además, el service de usuarios la quita antes de devolver el usuario.

### Manejo de errores

Hay un formato único para todos los errores de la API: `{ "status": "error", "message": "..." }`. Los services lanzan un `HttpError` con el código correspondiente y el middleware `errorHandler` (`src/middlewares/error.middleware.js`), registrado al final de `app.js`, arma la respuesta. Los handlers async se envuelven con `asyncHandler`, por lo que los controllers no necesitan `try/catch`.

| Código | Significado | Ejemplo |
| ------ | ----------- | ------- |
| `400` | Datos inválidos | Falta un campo, `quantity` inválida, id mal formado, body que no es JSON válido |
| `401` | No autenticado | Ruta privada sin sesión o con token inválido o vencido |
| `403` | Sin permisos | Rol insuficiente, o un recurso que pertenece a otro usuario |
| `404` | No encontrado | Evento o ticket inexistente, o ruta que no existe |
| `409` | Conflicto | Email ya registrado, inscripción duplicada, sin cupo, evento cancelado o finalizado |
| `500` | Error interno | Cualquier error inesperado: responde un mensaje genérico y el detalle solo se registra en el servidor |

## Estrategias de Passport

Toda la autenticación está centralizada en `src/config/passport.config.js`. Las estrategias solo conectan Passport con el service: la lógica de negocio (validaciones, hash, duplicados) vive en `users.service.js`.
`app.js` solo llama a `initializePassport()` y `passport.initialize()`.

| Estrategia | Tipo | Qué hace |
| ---------- | ---- | -------- |
| `register` | passport-local | Delega en `usersService.register`: valida los datos, normaliza el email, verifica que no exista, hashea la contraseña con bcrypt y crea el usuario con rol `user` por defecto. |
| `login`    | passport-local | Delega en `usersService.authenticate`. Ante cualquier fallo de autenticación responde con el mismo mensaje genérico "Credenciales inválidas". |
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
| Inscribirse a un evento             |  ✅  |    ✅     |  ✅   |
| Ver los tickets de un evento        |  ❌  | ✅ (solo sus eventos) |  ✅   |
| Cancelar un ticket                  | ✅ (solo propios) | ✅ (solo propios) | ✅ (cualquiera) |

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
| POST   | `/api/events/:eid/tickets`    | Cualquier usuario autenticado |
| GET    | `/api/tickets/my-tickets`     | Cualquier usuario autenticado (solo sus tickets) |
| GET    | `/api/events/:eid/tickets`    | `organizer` (solo sus eventos) y `admin` |
| PATCH  | `/api/tickets/:tid/cancel`    | Dueño del ticket y `admin` |
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
| POST   | `/api/events/:eid/tickets` | Inscribirse a un evento (crea un ticket)           | **Sí**          | cualquiera |
| GET    | `/api/events/:eid/tickets` | Lista los tickets de un evento                     | **Sí**          | organizer (propios), admin |
| GET    | `/api/tickets/my-tickets` | Lista los tickets del usuario autenticado           | **Sí**          | cualquiera |
| PATCH  | `/api/tickets/:tid/cancel` | Cancela un ticket                                  | **Sí**          | dueño del ticket, admin |
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

## Tickets e inscripciones

### Modelo Ticket

Solo guarda **referencias** (no objetos embebidos): el usuario y el evento se almacenan como `ObjectId`.

| Campo             | Tipo     | Reglas |
| ----------------- | -------- | ------ |
| `user`            | ObjectId | Referencia a `User` (sale del token, nunca del body) |
| `event`           | ObjectId | Referencia a `Event` |
| `status`          | String   | `confirmed`, `pending` o `cancelled` (por defecto `confirmed`) |
| `quantity`        | Number   | Entero mayor que 0 |
| `reservationCode` | String   | Único, generado automáticamente (formato `RES-XXXXXXXX`) |
| `createdAt`       | Date     | Automático (`timestamps`) |
| `cancelledAt`     | Date     | `null` hasta que se cancela |

### Estados del ticket

| Estado      | Significado | ¿Ocupa cupo? |
| ----------- | ----------- | :----------: |
| `confirmed` | Inscripción confirmada (estado inicial al inscribirse) | Sí |
| `pending`   | Estado definido para flujos futuros (por ejemplo, pagos) | Sí |
| `cancelled` | Inscripción cancelada; el documento **no se elimina** | No |

### Flujo de inscripción

`POST /api/events/:eid/tickets` recorre estas validaciones, todas dentro de `tickets.service.js` (no en el controller ni en la ruta):

1. El id del evento es válido (`400`) y el evento existe (`404`). Los borradores se tratan como inexistentes.
2. El evento está publicado: si está cancelado o finalizado, error de negocio (`409`).
3. `quantity` es un entero mayor que 0 (`400`). Si no se envía, se asume `1`.
4. El usuario no tiene ya un ticket activo para ese evento (`409`). Si cancela, puede volver a inscribirse.
5. Hay cupos suficientes (`409` con el mensaje `No hay cupos suficientes. Cupos disponibles: N`).
6. Se crea el ticket con estado `confirmed` y un `reservationCode` único.
7. Se envía el email de confirmación al usuario. Si el envío falla, la inscripción **no se pierde**: el error se registra en consola y la respuesta sigue siendo `201`.

### Regla de cupos

`cupos disponibles = capacity del evento − suma de quantity de los tickets activos`

Solo cuentan los tickets con estado `confirmed` o `pending`. Los `cancelled` **no ocupan cupo**, por lo que al cancelar un ticket el cupo queda disponible automáticamente, sin ningún paso extra.

### Notificaciones por email (Nodemailer)

Al confirmarse una inscripción se envía un email a la dirección del usuario autenticado con el evento, la fecha, el lugar, la cantidad de entradas y el código de reserva. La configuración sale de variables de entorno (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`); ninguna credencial está en el código y `.env.example` las incluye con valores de ejemplo.

Con Gmail hay que activar la verificación en 2 pasos y generar una *contraseña de aplicación* (https://myaccount.google.com/apppasswords) para usarla en `MAIL_PASS`, con `MAIL_HOST=smtp.gmail.com` y `MAIL_PORT=587`.

### POST /api/events/:eid/tickets

Requiere sesión (cualquier rol). Body (JSON) opcional: `quantity`.

```json
{ "quantity": 2 }
```

Respuesta `201`:

```json
{
  "status": "success",
  "payload": {
    "id": "6abf569d...",
    "status": "confirmed",
    "quantity": 2,
    "reservationCode": "RES-4E94558E",
    "createdAt": "2026-10-02T07:00:45.383Z",
    "cancelledAt": null,
    "event": "6abf5661...",
    "user": "6abf565f..."
  }
}
```

- `400`: id de evento inválido o `quantity` inválida (`"La cantidad debe ser un número entero mayor que 0"`).
- `401`: sin sesión.
- `404`: el evento no existe (`"Evento no encontrado"`).
- `409`: evento cancelado (`"El evento está cancelado, no admite inscripciones"`), evento finalizado (`"El evento ya finalizó, no admite inscripciones"`), inscripción activa duplicada (`"Ya tenés una inscripción activa para este evento"`) o cupos insuficientes (`"No hay cupos suficientes. Cupos disponibles: 1"`).

### GET /api/tickets/my-tickets

Requiere sesión. Devuelve solo los tickets del usuario autenticado, del más reciente al más antiguo, con los datos del evento (`title`, `date`, `location`) obtenidos con `populate`.

```json
{
  "status": "success",
  "payload": [
    {
      "id": "6abf569d...",
      "status": "confirmed",
      "quantity": 2,
      "reservationCode": "RES-4E94558E",
      "createdAt": "2026-10-02T07:00:45.383Z",
      "cancelledAt": null,
      "event": { "id": "6abf5661...", "title": "Evento PE7", "date": "2026-11-11T18:00:00.000Z", "location": "Cordoba" },
      "user": "6abf565f..."
    }
  ]
}
```

### GET /api/events/:eid/tickets

Requiere sesión y rol `organizer` (solo de sus propios eventos) o `admin`. Lista los tickets del evento; de cada usuario se exponen únicamente `id`, `first_name`, `last_name` y `email` (nunca la contraseña).

- `200`: lista de tickets (`payload`).
- `400`: id inválido. `401`: sin sesión. `404`: el evento no existe.
- `403`: usuario con rol `user`, o `organizer` que no es dueño del evento.

### PATCH /api/tickets/:tid/cancel

Requiere sesión. Lo puede ejecutar el dueño del ticket o un `admin`. Cambia el estado a `cancelled` y registra `cancelledAt`; el documento no se elimina.

- `200`: devuelve el ticket con `"status": "cancelled"` y `cancelledAt`.
- `400`: id inválido. `401`: sin sesión.
- `403`: el ticket pertenece a otro usuario y quien cancela no es `admin`.
- `404`: el ticket no existe (`"Ticket no encontrado"`).
- `409`: el ticket ya estaba cancelado (`"El ticket ya está cancelado"`).

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

# Inscribirse a un evento (requiere sesión)
curl -X POST http://localhost:3000/api/events/<ID_EVENTO>/tickets \
  -H "Content-Type: application/json" -b ~/cookies.txt \
  -d '{"quantity":2}'

# Mis tickets
curl http://localhost:3000/api/tickets/my-tickets -b ~/cookies.txt

# Cancelar un ticket
curl -X PATCH http://localhost:3000/api/tickets/<ID_TICKET>/cancel -b ~/cookies.txt

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

Tickets e inscripciones (Pre-entrega 7):

- Inscripción exitosa → `201` y email de confirmación recibido.
- Inscripción sin sesión → `401`.
- Inscripción a un evento inexistente → `404`; con id inválido → `400`.
- Inscripción a un evento cancelado o finalizado → `409`.
- `quantity` igual a 0, decimal o texto → `400`.
- Inscripción cuando no hay cupo suficiente → `409` con los cupos disponibles.
- Inscripción duplicada activa → `409`.
- Cancelación propia → `200` con `cancelledAt`; el cupo queda libre y una nueva inscripción por ese cupo funciona.
- Cancelar un ticket ya cancelado → `409`; ticket inexistente → `404`.
- Cancelar el ticket de otro usuario siendo `user` → `403`.
- `GET /api/events/:eid/tickets` como `user` común → `403`; como `organizer` de otro evento → `403`; como `organizer` dueño → `200`.
- `GET /api/tickets/my-tickets` devuelve solo los tickets propios, con `title`, `date` y `location` del evento.

Arquitectura (Pre-entrega 8):

- Flujo completo: registro → login → crear evento (organizer) → inscribirse → mis tickets → cancelar.
- `GET /api/sessions/current` devuelve solo `id`, `email` y `role` (sin `password`).
- `GET /api/events/:eid/tickets` (con `populate` del usuario) no incluye `password` ni hashes.
- Un error de negocio (inscripción duplicada, sin cupo, evento cancelado) responde `409`, nunca `500`.
- Ruta protegida sin sesión → `401`; con sesión sin permisos → `403`.
- Body que no es JSON válido → `400`; ruta inexistente → `404`; ambos con el formato `{ status: "error", message }`.
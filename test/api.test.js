import { describe, it, before, after, mock } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "secreto_solo_para_tests";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_SALT_ROUNDS = "4";
process.env.MAIL_FROM = "Tests <tests@example.com>";

const sentMails = [];
let failMail = false;
mock.method(nodemailer, "createTransport", () => ({
  sendMail: async (message) => {
    if (failMail) throw new Error("SMTP caído");
    sentMails.push(message);
  },
}));

const { default: app } = await import("../src/app.js");
const { default: User } = await import("../src/models/User.js");

const PASSWORD = "Secreta123";
const daysFromNow = (days) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const eventBody = (overrides = {}) => ({
  title: "Congreso Tech",
  description: "Charlas y talleres",
  category: "workshop",
  date: daysFromNow(30),
  location: "Cordoba",
  capacity: 5,
  price: 1000,
  ...overrides,
});

const createLoggedAgent = async (email, role = "user") => {
  await request(app).post("/api/sessions/register").send({
    first_name: "Test",
    last_name: role,
    email,
    password: PASSWORD,
  });

  if (role !== "user") {
    await User.updateOne({ email }, { role });
  }

  const agent = request.agent(app);
  const login = await agent
    .post("/api/sessions/login")
    .send({ email, password: PASSWORD });
  assert.equal(login.status, 200);

  return agent;
};

let mongoServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  mock.restoreAll();
});

describe("Autenticación y usuarios", () => {
  it("registra un usuario con rol user y sin devolver la password", async () => {
    const res = await request(app).post("/api/sessions/register").send({
      first_name: "Ana",
      last_name: "Perez",
      email: "  Ana@Mail.com ",
      password: PASSWORD,
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.payload.email, "ana@mail.com");
    assert.equal(res.body.payload.role, "user");
    assert.ok(!JSON.stringify(res.body).includes("password"));

    const saved = await User.findOne({ email: "ana@mail.com" }).lean();
    assert.notEqual(saved.password, PASSWORD);
    assert.match(saved.password, /^\$2[aby]\$/);
  });

  it("ignora el role enviado en el body del registro público", async () => {
    const res = await request(app).post("/api/sessions/register").send({
      first_name: "Eva",
      last_name: "Intrusa",
      email: "eva@mail.com",
      password: PASSWORD,
      role: "admin",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.payload.role, "user");
  });

  it("rechaza un email ya registrado con 409", async () => {
    const res = await request(app).post("/api/sessions/register").send({
      first_name: "Ana",
      last_name: "Perez",
      email: "ana@mail.com",
      password: PASSWORD,
    });

    assert.equal(res.status, 409);
  });

  it("rechaza datos inválidos en el registro con 400", async () => {
    const res = await request(app).post("/api/sessions/register").send({
      first_name: "Sin",
      last_name: "Password",
      email: "sinpass@mail.com",
    });

    assert.equal(res.status, 400);
  });

  it("rechaza credenciales incorrectas con 401", async () => {
    const res = await request(app)
      .post("/api/sessions/login")
      .send({ email: "ana@mail.com", password: "incorrecta123" });

    assert.equal(res.status, 401);
  });

  it("login → /current → logout → /current devuelve 401", async () => {
    const agent = request.agent(app);

    const login = await agent
      .post("/api/sessions/login")
      .send({ email: "ana@mail.com", password: PASSWORD });
    assert.equal(login.status, 200);

    const cookie = login.headers["set-cookie"].join(";");
    assert.match(cookie, /currentUser=/);
    assert.match(cookie, /HttpOnly/i);
    assert.ok(!JSON.stringify(login.body).includes("password"));

    const current = await agent.get("/api/sessions/current");
    assert.equal(current.status, 200);
    assert.equal(current.body.payload.email, "ana@mail.com");
    assert.equal(current.body.payload.role, "user");
    assert.ok(!JSON.stringify(current.body).includes("password"));

    const logout = await agent.post("/api/sessions/logout");
    assert.equal(logout.status, 200);

    const afterLogout = await agent.get("/api/sessions/current");
    assert.equal(afterLogout.status, 401);
  });

  it("/current sin cookie devuelve 401", async () => {
    const res = await request(app).get("/api/sessions/current");
    assert.equal(res.status, 401);
  });

  it("/api/users: 401 sin sesión, 403 para user y sin password para admin", async () => {
    const anon = await request(app).get("/api/users");
    assert.equal(anon.status, 401);

    const user = await createLoggedAgent("user-lista@mail.com");
    assert.equal((await user.get("/api/users")).status, 403);

    const admin = await createLoggedAgent("admin-lista@mail.com", "admin");
    const res = await admin.get("/api/users");
    assert.equal(res.status, 200);
    assert.ok(res.body.payload.length >= 1);
    assert.ok(!JSON.stringify(res.body).includes("password"));
  });
});

describe("Eventos y autorización", () => {
  let organizer;
  let otherOrganizer;
  let admin;
  let user;
  let eventId;

  before(async () => {
    organizer = await createLoggedAgent("org-eventos@mail.com", "organizer");
    otherOrganizer = await createLoggedAgent("org-ajeno@mail.com", "organizer");
    admin = await createLoggedAgent("admin-eventos@mail.com", "admin");
    user = await createLoggedAgent("user-eventos@mail.com");
  });

  it("sin sesión no se puede crear un evento (401)", async () => {
    const res = await request(app).post("/api/events").send(eventBody());
    assert.equal(res.status, 401);
  });

  it("un user no puede crear eventos (403)", async () => {
    const res = await user.post("/api/events").send(eventBody());
    assert.equal(res.status, 403);
  });

  it("un organizer crea un evento y queda como dueño", async () => {
    const res = await organizer.post("/api/events").send(eventBody());

    assert.equal(res.status, 201);
    assert.equal(res.body.payload.status, "published");
    assert.ok(res.body.payload.organizer);
    eventId = res.body.payload.id;
  });

  it("valida fecha pasada, capacity y price al crear (400)", async () => {
    const pastDate = await organizer
      .post("/api/events")
      .send(eventBody({ date: "2020-01-01" }));
    assert.equal(pastDate.status, 400);

    const badCapacity = await organizer
      .post("/api/events")
      .send(eventBody({ capacity: 0 }));
    assert.equal(badCapacity.status, 400);

    const badPrice = await organizer
      .post("/api/events")
      .send(eventBody({ price: -1 }));
    assert.equal(badPrice.status, 400);
  });

  it("GET /api/events/:id devuelve el evento", async () => {
    const res = await request(app).get(`/api/events/${eventId}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.payload.id, eventId);
  });

  it("GET /api/events/:id con un id inexistente devuelve 404", async () => {
    const res = await request(app).get(
      `/api/events/${new mongoose.Types.ObjectId()}`,
    );
    assert.equal(res.status, 404);
  });

  it("un organizer no puede modificar un evento ajeno (403)", async () => {
    const res = await otherOrganizer
      .put(`/api/events/${eventId}`)
      .send({ title: "Intento ajeno" });

    assert.equal(res.status, 403);
  });

  it("el dueño modifica su evento, pero no con una fecha pasada", async () => {
    const ok = await organizer
      .put(`/api/events/${eventId}`)
      .send({ title: "Congreso Tech 2026" });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.payload.title, "Congreso Tech 2026");

    const pastDate = await organizer
      .put(`/api/events/${eventId}`)
      .send({ date: "2020-01-01" });
    assert.equal(pastDate.status, 400);
  });

  it("un admin modifica el evento de otro organizador", async () => {
    const res = await admin
      .put(`/api/events/${eventId}`)
      .send({ title: "Editado por admin" });

    assert.equal(res.status, 200);
    assert.equal(res.body.payload.title, "Editado por admin");
  });

  it("un evento cancelado no se puede modificar (409)", async () => {
    const created = await organizer.post("/api/events").send(eventBody());
    const id = created.body.payload.id;

    const cancel = await organizer
      .patch(`/api/events/${id}/status`)
      .send({ status: "cancelled" });
    assert.equal(cancel.status, 200);
    assert.equal(cancel.body.payload.status, "cancelled");

    const edit = await organizer
      .put(`/api/events/${id}`)
      .send({ title: "Ya cancelado" });
    assert.equal(edit.status, 409);
  });

  it("el listado devuelve data, page, limit, total y totalPages", async () => {
    for (let i = 0; i < 4; i += 1) {
      await organizer
        .post("/api/events")
        .send(
          eventBody({ title: `Evento paginado ${i}`, category: "paginado" }),
        );
    }

    const res = await request(app).get(
      "/api/events?status=published&category=paginado&page=2&limit=3",
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.status, "success");
    assert.equal(res.body.page, 2);
    assert.equal(res.body.limit, 3);
    assert.equal(res.body.total, 4);
    assert.equal(res.body.totalPages, 2);
    assert.equal(res.body.data.length, 1);
  });

  it("el listado rechaza parámetros inválidos con 400", async () => {
    const res = await request(app).get("/api/events?page=abc");
    assert.equal(res.status, 400);
  });
});

describe("Inscripciones y control de cupos", () => {
  let organizer;
  let admin;
  let userA;
  let userB;
  let userC;
  let eventId;
  let ticketA;

  const enroll = (agent, id, body = {}) =>
    agent.post(`/api/events/${id}/tickets`).send(body);

  before(async () => {
    organizer = await createLoggedAgent("org-tickets@mail.com", "organizer");
    admin = await createLoggedAgent("admin-tickets@mail.com", "admin");
    userA = await createLoggedAgent("a-tickets@mail.com");
    userB = await createLoggedAgent("b-tickets@mail.com");
    userC = await createLoggedAgent("c-tickets@mail.com");

    const created = await organizer
      .post("/api/events")
      .send(eventBody({ capacity: 3 }));
    eventId = created.body.payload.id;
  });

  it("sin sesión no se puede inscribir (401)", async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/tickets`)
      .send({});
    assert.equal(res.status, 401);
  });

  it("inscribe a un user y le envía el email de confirmación", async () => {
    sentMails.length = 0;

    const res = await enroll(userA, eventId, { quantity: 2 });

    assert.equal(res.status, 201);
    assert.equal(res.body.payload.status, "confirmed");
    assert.equal(res.body.payload.quantity, 2);
    assert.match(res.body.payload.reservationCode, /^RES-/);
    ticketA = res.body.payload;

    assert.equal(sentMails.length, 1);
    assert.equal(sentMails[0].to, "a-tickets@mail.com");
    assert.match(sentMails[0].subject, /confirmada/i);
    assert.ok(sentMails[0].text.includes(ticketA.reservationCode));
  });

  it("rechaza una inscripción duplicada activa (409)", async () => {
    const res = await enroll(userA, eventId, { quantity: 1 });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /inscripción activa/i);
  });

  it("rechaza una inscripción sin cupo suficiente (409)", async () => {
    const res = await enroll(userB, eventId, { quantity: 2 });

    assert.equal(res.status, 409);
    assert.match(res.body.message, /cupos/i);
  });

  it("acepta la inscripción que entra justo en el cupo restante", async () => {
    const res = await enroll(userB, eventId, { quantity: 1 });
    assert.equal(res.status, 201);

    const full = await enroll(userC, eventId, { quantity: 1 });
    assert.equal(full.status, 409);
  });

  it("valida quantity y el id del evento (400) y el evento inexistente (404)", async () => {
    const badQuantity = await enroll(userC, eventId, { quantity: 0 });
    assert.equal(badQuantity.status, 400);

    const badId = await enroll(userC, "no-es-un-id", {});
    assert.equal(badId.status, 400);

    const missing = await enroll(userC, new mongoose.Types.ObjectId(), {});
    assert.equal(missing.status, 404);
  });

  it("no permite inscribirse a un evento cancelado (409)", async () => {
    const created = await organizer.post("/api/events").send(eventBody());
    const id = created.body.payload.id;
    await organizer.patch(`/api/events/${id}/status`).send({
      status: "cancelled",
    });

    const res = await enroll(userC, id, {});
    assert.equal(res.status, 409);
  });

  it("my-tickets devuelve solo los propios con datos del evento", async () => {
    const res = await userA.get("/api/tickets/my-tickets");

    assert.equal(res.status, 200);
    assert.equal(res.body.payload.length, 1);
    assert.equal(res.body.payload[0].id, ticketA.id);
    assert.ok(res.body.payload[0].event.title);
    assert.ok(!JSON.stringify(res.body).includes("password"));
  });

  it("los tickets de un evento los ve el organizer dueño o un admin", async () => {
    const asUser = await userA.get(`/api/events/${eventId}/tickets`);
    assert.equal(asUser.status, 403);

    const otherOrganizer = await createLoggedAgent(
      "org-ajeno-tickets@mail.com",
      "organizer",
    );
    const asOther = await otherOrganizer.get(`/api/events/${eventId}/tickets`);
    assert.equal(asOther.status, 403);

    const asOwner = await organizer.get(`/api/events/${eventId}/tickets`);
    assert.equal(asOwner.status, 200);
    assert.equal(asOwner.body.payload.length, 2);
    assert.ok(!JSON.stringify(asOwner.body).includes("password"));

    const asAdmin = await admin.get(`/api/events/${eventId}/tickets`);
    assert.equal(asAdmin.status, 200);
  });

  it("solo el dueño o un admin pueden cancelar un ticket (403 para otro)", async () => {
    const res = await userC.patch(`/api/tickets/${ticketA.id}/cancel`);
    assert.equal(res.status, 403);
  });

  it("al cancelar, el ticket no se elimina, se libera el cupo y se avisa por mail", async () => {
    sentMails.length = 0;

    const res = await userA.patch(`/api/tickets/${ticketA.id}/cancel`);

    assert.equal(res.status, 200);
    assert.equal(res.body.payload.status, "cancelled");
    assert.ok(res.body.payload.cancelledAt);

    assert.equal(sentMails.length, 1);
    assert.equal(sentMails[0].to, "a-tickets@mail.com");
    assert.match(sentMails[0].subject, /cancelada/i);

    const again = await userA.patch(`/api/tickets/${ticketA.id}/cancel`);
    assert.equal(again.status, 409);

    const mine = await userA.get("/api/tickets/my-tickets");
    assert.equal(mine.body.payload.length, 1);
    assert.equal(mine.body.payload[0].status, "cancelled");
  });

  it("tras cancelar, el cupo queda libre y una nueva inscripción funciona", async () => {
    const res = await enroll(userC, eventId, { quantity: 2 });
    assert.equal(res.status, 201);

    const again = await enroll(userA, eventId, { quantity: 1 });
    assert.equal(again.status, 409);
  });

  it("un admin cancela el ticket de otro y el aviso llega al dueño del ticket", async () => {
    sentMails.length = 0;

    const mine = await userC.get("/api/tickets/my-tickets");
    const ticket = mine.body.payload.find((t) => t.status === "confirmed");

    const res = await admin.patch(`/api/tickets/${ticket.id}/cancel`);

    assert.equal(res.status, 200);
    assert.equal(sentMails.length, 1);
    assert.equal(sentMails[0].to, "c-tickets@mail.com");
  });

  it("si falla el envío del mail la inscripción igual se crea", async () => {
    const created = await organizer
      .post("/api/events")
      .send(eventBody({ capacity: 10 }));
    const id = created.body.payload.id;

    const silenced = mock.method(console, "error", () => {});
    failMail = true;

    try {
      const res = await enroll(userB, id, { quantity: 1 });
      assert.equal(res.status, 201);
      assert.equal(res.body.payload.status, "confirmed");
    } finally {
      failMail = false;
      silenced.mock.restore();
    }
  });
});

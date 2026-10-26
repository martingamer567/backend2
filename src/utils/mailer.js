import nodemailer from "nodemailer";
import { config } from "../config/config.js";

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.mail.host,
      port: config.mail.port,
      secure: config.mail.port === 465,
      auth: { user: config.mail.user, pass: config.mail.pass },
    });
  }
  return transporter;
};

const formatEventDate = (date) =>
  new Date(date).toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Argentina/Cordoba",
  });

export const sendEnrollmentConfirmation = async ({ to, event, ticket }) => {
  await getTransporter().sendMail({
    from: config.mail.from,
    to,
    subject: `Inscripción confirmada: ${event.title}`,
    text: [
      "¡Tu inscripción fue confirmada!",
      "",
      `Evento: ${event.title}`,
      `Fecha: ${formatEventDate(event.date)}`,
      `Lugar: ${event.location}`,
      `Cantidad de entradas: ${ticket.quantity}`,
      `Código de reserva: ${ticket.reservationCode}`,
    ].join("\n"),
  });
};

export const sendCancellationNotice = async ({ to, event, ticket }) => {
  await getTransporter().sendMail({
    from: config.mail.from,
    to,
    subject: `Inscripción cancelada: ${event.title}`,
    text: [
      "Tu inscripción fue cancelada.",
      "",
      `Evento: ${event.title}`,
      `Fecha: ${formatEventDate(event.date)}`,
      `Lugar: ${event.location}`,
      `Cantidad de entradas: ${ticket.quantity}`,
      `Código de reserva: ${ticket.reservationCode}`,
      "",
      "Los cupos quedaron liberados. Si querés, podés volver a inscribirte.",
    ].join("\n"),
  });
};

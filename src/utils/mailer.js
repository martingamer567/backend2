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

export const sendEnrollmentConfirmation = async ({ to, event, ticket }) => {
  const eventDate = new Date(event.date).toLocaleString("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Argentina/Cordoba",
  });

  await getTransporter().sendMail({
    from: config.mail.from,
    to,
    subject: `Inscripción confirmada: ${event.title}`,
    text: [
      "¡Tu inscripción fue confirmada!",
      "",
      `Evento: ${event.title}`,
      `Fecha: ${eventDate}`,
      `Lugar: ${event.location}`,
      `Cantidad de entradas: ${ticket.quantity}`,
      `Código de reserva: ${ticket.reservationCode}`,
    ].join("\n"),
  });
};

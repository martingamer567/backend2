const isPopulated = (value, field) =>
  value !== null && typeof value === "object" && value[field] !== undefined;

export class TicketDTO {
  constructor(ticket) {
    const { event, user } = ticket;

    this.id = ticket._id.toString();
    this.status = ticket.status;
    this.quantity = ticket.quantity;
    this.reservationCode = ticket.reservationCode;
    this.createdAt = ticket.createdAt;
    this.cancelledAt = ticket.cancelledAt ?? null;

    this.event = isPopulated(event, "title")
      ? {
          id: event._id.toString(),
          title: event.title,
          date: event.date,
          location: event.location,
        }
      : (event?.toString() ?? null);

    this.user = isPopulated(user, "email")
      ? {
          id: user._id.toString(),
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        }
      : (user?.toString() ?? null);
  }
}

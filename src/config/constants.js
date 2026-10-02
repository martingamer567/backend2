export const EVENT_STATUS = Object.freeze({
  DRAFT: "draft",
  PUBLISHED: "published",
  CANCELLED: "cancelled",
  FINISHED: "finished",
});

export const TICKET_STATUS = Object.freeze({
  CONFIRMED: "confirmed",
  PENDING: "pending",
  CANCELLED: "cancelled",
});

export const ACTIVE_TICKET_STATUSES = Object.freeze([
  TICKET_STATUS.CONFIRMED,
  TICKET_STATUS.PENDING,
]);

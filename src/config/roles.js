export const ROLES = Object.freeze({
  USER: "user",
  ORGANIZER: "organizer",
  ADMIN: "admin",
});

export const PERMISSIONS = Object.freeze({
  viewPublishedEvents: [ROLES.USER, ROLES.ORGANIZER, ROLES.ADMIN],
  createEvents: [ROLES.ORGANIZER, ROLES.ADMIN],
  manageOwnEvents: [ROLES.ORGANIZER, ROLES.ADMIN],
  manageAnyEvent: [ROLES.ADMIN],
  viewAllUsers: [ROLES.ADMIN],
});

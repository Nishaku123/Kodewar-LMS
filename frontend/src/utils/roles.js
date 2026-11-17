/**
 * Role names come from the database `roles` table.
 * Keeping the labels and landing routes in one place prevents drift.
 */
export const ROLE_LABELS = {
  student: "Student",
  trainer: "Trainer",
  admin: "Administrator",
};

export function roleLabel(role) {
  return ROLE_LABELS[role] || "Member";
}

/**
 * Every role has a real signed-in destination.
 * Student learning screens are the focus of Phase 3. Staff roles land on a
 * shared workspace page until their dedicated panels are built.
 */
export function roleHome(role) {
  return role === "student" ? "/student" : "/staff";
}

export function formatDate(value, fallback = "Not available") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value, fallback = "Not yet") {
  if (!value) return fallback;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

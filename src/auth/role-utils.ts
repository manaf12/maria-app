export function normalizeRoles(roles?: string[]) {
  return (roles ?? []).map((role) => role.trim().toUpperCase());
}

export function isAdminRole(roles?: string[]) {
  const normalizedRoles = normalizeRoles(roles);
  return normalizedRoles.includes("ADMIN") || normalizedRoles.includes("SUPER_ADMIN");
}

export function isSuperAdminRole(roles?: string[]) {
  return normalizeRoles(roles).includes("SUPER_ADMIN");
}

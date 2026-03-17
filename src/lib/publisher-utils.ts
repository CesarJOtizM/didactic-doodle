import { Gender, Role } from '@/generated/prisma/enums';

/** Roles that indicate a baptized publisher */
const BAPTIZED_ROLES: Role[] = [
  Role.ELDER,
  Role.MINISTERIAL_SERVANT,
  Role.BAPTIZED_PUBLISHER,
];

/** Roles eligible for female publishers */
const FEMALE_ELIGIBLE_ROLES: Role[] = [
  Role.BAPTIZED_PUBLISHER,
  Role.UNBAPTIZED_PUBLISHER,
];

/**
 * Returns true if the role implies the publisher is baptized.
 * ELDER, MINISTERIAL_SERVANT, and BAPTIZED_PUBLISHER are all baptized roles.
 */
export function isBaptized(rol: Role): boolean {
  return BAPTIZED_ROLES.includes(rol);
}

/**
 * Validates whether a given role is eligible for the specified gender.
 * Women can only be BAPTIZED_PUBLISHER or UNBAPTIZED_PUBLISHER.
 * Men can hold any role.
 */
export function isEligibleRole(sexo: Gender, rol: Role): boolean {
  if (sexo === Gender.FEMALE) {
    return FEMALE_ELIGIBLE_ROLES.includes(rol);
  }
  return true;
}

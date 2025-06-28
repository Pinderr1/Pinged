export const allowedDomains = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'aol.com',
  'protonmail.com',
  'live.com',
  'me.com',
];

export function isAllowedDomain(email) {
  if (!email) return false;
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 && allowedDomains.includes(parts[1]);
}

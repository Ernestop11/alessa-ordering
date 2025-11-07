export function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) return `${email.slice(0, 2)}•••`;
  const visible = user.slice(0, 2);
  return `${visible}${user.length > 2 ? '•••' : ''}@${domain}`;
}

export function maskPhone(phone: string) {
  const cleaned = phone.replace(/\D+/g, '');
  const last4 = cleaned.slice(-4);
  return `•••${last4}`;
}

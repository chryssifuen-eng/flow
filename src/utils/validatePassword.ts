export function validatePassword(password: string): boolean {
  // 8-20 chars, mayúscula, minúscula, número, especial
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/.test(password);
}
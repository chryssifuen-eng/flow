export type UserRole = "admin" | "user";

export interface UserProfile {
  id: string;
  email: string;
  fullname: string;
  employeenumber: string;
  workshop: string;
  zone: string;
  phone: string;
  role: UserRole;
  createdat: Date;
}
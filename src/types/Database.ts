export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          fullname: string;
          employeenumber: string;
          workshop: string;
          zone: string;
          phone: string;
          role: string;
          createdat: string; // debe ser string, no Date
        };
        Insert: {
          id: string;
          email: string;
          fullname: string;
          employeenumber: string;
          workshop: string;
          zone: string;
          phone: string;
          role?: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          email?: string;
          fullname?: string;
          employeenumber?: string;
          workshop?: string;
          zone?: string;
          phone?: string;
          role?: string;
          createdat?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
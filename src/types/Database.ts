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
      files: {
        Row: {
          id: string;
          fileName: string;
          path: string;
          url: string;
          size: number;
          type: string;
          user_id: string;
          uploadedAt: string;
          downloadCount: number;
        };
        Insert: {
          id: string;
          fileName: string;
          path: string;
          url: string;
          size?: number;
          type?: string;
          user_id: string;
          uploadedAt?: string;
          downloadCount?: number;
        };
        Update: {
          id?: string;
          fileName?: string;
          path?: string;
          url?: string;
          size?: number;
          type?: string;
          user_id?: string;
          uploadedAt?: string;
          downloadCount?: number;
        };
      };
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
          createdAt: string; // debe ser string, no Date
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
          createdAt?: string;
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
          createdAt?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
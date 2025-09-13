
import { UserProfile } from "../types/User";
import type { Database } from "../types/Database"; 
import { supabase } from "../services/supabase"; // La ruta puede variar, revisa tu estructura de carpetas
// Cliente ANON para front-end


export interface RegisterForm {
  fullname:        string;
  email:           string;
  employeenumber:  string;
  workshop:        string;
  zone:            string;
  phone:           string;
  password:        string;
}

export async function getUserRole(userId: string): Promise<"admin" | "user"> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return "user"; // fallback seguro
  return data.role;
}

export async function registerUser(form: RegisterForm): Promise<UserProfile> {
  const { fullname, email, employeenumber, workshop, zone, phone, password } = form;

  // 1) Crear usuario en Auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) throw signUpError;
  if (!authData.user) throw new Error("No se creó el usuario en Auth.");

  const userId = authData.user.id;

  // 2) Insertar perfil en 'profiles'
  //    - usamos tus columnas sin guiones bajos
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .insert([
      {
        id:               userId,
        fullname:         fullname,
        employeenumber:   employeenumber,
        workshop:         workshop,
        zone:             zone,
        phone:            phone,
        email:            email,
        role:             "user",
        createdAt:        new Date()            // o elimínalo si tienes DEFAULT now()
      }
    ])
    .select()
    .single();

  if (profileError) throw profileError;
  return {
    ...profile,
    createdAt: new Date(profile.createdAt),
    role: profile.role as UserProfile["role"],
  };
}

export async function loginUser(email: string, password: string): Promise<UserProfile> {
  // 1) Login en Auth
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  if (!authData.user) throw new Error("Usuario no encontrado.");

  const userId = authData.user.id;

  // 2) Consultar perfil por 'id'
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  // 3) Convertir a tipo UserProfile
  return {
    ...profileRow,
    createdAt: new Date(profileRow.createdAt),
    role: profileRow.role as UserProfile["role"],
  };
  
}
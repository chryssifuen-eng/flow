// src/services/storage.ts
import { supabase } from "./supabase";

// Nueva función para normalizar el nombre del archivo
function normalizeFileName(fileName: string): string {
  // Reemplaza todos los caracteres no alfanuméricos (excepto el punto y el guion) con guiones bajos.
  // Esto incluye espacios, tildes, etc.
  // Además, convierte todo a minúsculas para consistencia.
  const normalized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();

  // Asegura que no haya guiones múltiples seguidos.
  return normalized.replace(/__+/g, "_");
}

export async function uploadFile(userId: string, file: File) {
  // Normaliza el nombre del archivo antes de usarlo en la subida
  const normalizedName = normalizeFileName(file.name);

  // Combina el userId y el nombre normalizado para crear una ruta de almacenamiento única.
  const filePath = `${userId}/${Date.now()}-${normalizedName}`;

  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(filePath, file);

  if (error) throw error;
  return data;
}
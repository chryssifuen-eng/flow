import { supabase } from "./supabase";

export interface AdminFileItem {
  id: string;
  fileName: string;
  uploadedAt: string;
  downloadCount: number;
  status: string;
  userId: string;
  size: number;
  type: string;
  path: string;
  url: string;
}

export interface AdminUserProfile {
  id: string;
  email: string;
  fullname: string;
  employeenumber: string;
  workshop: string;
  zone: string;
  phone: string;
  role: string;
  createdat: string;
}

// Obtener todos los archivos de todos los usuarios desde la tabla 'files'
export async function getAllFiles(): Promise<AdminFileItem[]> {
  const { data, error } = await supabase
    .from("files")
    .select(`
      id,
      filename,
      path,
      url,
      size,
      type,
      user_id,
      created_at,
      downloadcount
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching files:", error);
    throw error;
  }

  if (!data) return [];

  return data.map(file => ({
    id: file.id,
    fileName: file.filename,
    uploadedAt: new Date(file.created_at).toLocaleString('es-ES'),
    downloadCount: file.downloadcount || 0,
    status: "Subido",
    userId: file.user_id,
    size: file.size || 0,
    type: file.type || "other",
    path: file.path,
    url: file.url
  }));
}

// Obtener todos los usuarios desde la tabla 'profiles'
export async function getAllUsers(): Promise<AdminUserProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order('createdat', { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }

  return data || [];
}

// Eliminar archivo (solo admin)
export async function deleteFileAsAdmin(fileId: string, filePath: string): Promise<void> {
  try {
    // 1. Eliminar de la base de datos
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId);

    if (dbError) throw dbError;

    // 2. Eliminar del storage
    const { error: storageError } = await supabase.storage
      .from("uploads")
      .remove([filePath]);

    if (storageError) {
      console.warn("Archivo eliminado de la DB pero no del storage:", storageError);
    }
  } catch (error) {
    console.error("Error deleting file as admin:", error);
    throw error;
  }
}

// Obtener estadísticas del sistema
export async function getSystemStats() {
  try {
    // Contar usuarios
    const { count: userCount, error: userError } = await supabase
      .from("profiles")
      .select("*", { count: 'exact', head: true });

    if (userError) throw userError;

    // Contar archivos
    const { count: fileCount, error: fileError } = await supabase
      .from("files")
      .select("*", { count: 'exact', head: true });

    if (fileError) throw fileError;

    // Obtener archivos para calcular tamaño total y descargas
    const { data: filesData, error: filesError } = await supabase
      .from("files")
      .select("size, downloadcount, created_at");

    if (filesError) throw filesError;

    const totalSize = filesData?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
    const totalDownloads = filesData?.reduce((sum, file) => sum + (file.downloadcount || 0), 0) || 0;

    // Archivos recientes (última semana)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentFiles = filesData?.filter(file => 
      new Date(file.created_at) > weekAgo
    ).length || 0;

    return {
      totalUsers: userCount || 0,
      totalFiles: fileCount || 0,
      totalSize,
      totalDownloads,
      recentUploads: recentFiles
    };
  } catch (error) {
    console.error("Error getting system stats:", error);
    throw error;
  }
}

// Obtener actividad reciente
export async function getRecentActivity() {
  const { data, error } = await supabase
    .from("files")
    .select(`
      id,
      filename,
      created_at,
      user_id,
      profiles!inner(fullname, email)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }

  return data || [];
}
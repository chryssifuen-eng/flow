import { supabase } from "./supabase";

export interface FileData {
  id: string;
  fileName: string;
  uploadedAt: string;
  url: string;
  path: string;
  downloadCount?: number; // ⚠️ agregar esta línea para compatibilidad
}

export async function getUserFiles(userId: string) {
  const { data, error } = await supabase
    .storage
    .from("uploads")
    .list(userId + "/", { limit: 100 });

  if (error) throw error;
  if (!data) return [];

  // Filtramos cualquier placeholder
  const validFiles = data.filter(file => file.name !== ".emptyFolderPlaceholder");

  return validFiles.map((file) => {
    const { data: urlData } = supabase
      .storage
      .from("uploads")
      .getPublicUrl(`${userId}/${file.name}`);

    return {
      id: file.name,
      fileName: file.name,
      uploadedAt: new Date(file.updated_at).toLocaleString(),
      url: urlData.publicUrl,
      path: `${userId}/${file.name}`,
    };
  });
}

export async function downloadFile(path: string, filename: string) {
  const { data, error } = await supabase.storage.from("uploads").download(path);
  if (error) throw error;
  const url = window.URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

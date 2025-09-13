import { supabase } from "./supabase";

export async function getAllFiles() {
  let { data, error } = await supabase.storage.from("uploads").list("", { limit: 1000, offset: 0, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;
  let result: any[] = [];
  if (!data) return [];
  for (let folder of data) {
    if (folder.name) {
      let { data: folderFiles } = await supabase.storage.from("uploads").list(folder.name + "/", { limit: 100 });
      if (folderFiles) {
        result = result.concat(
          folderFiles.map((file: any) => ({
            id: folder.name + "/" + file.name,
            userId: folder.name,
            fileName: file.name,
            uploadedAt: new Date(file.created_at).toLocaleString(),
            downloadCount: file.metadata?.downloads ?? 0,
            status: "Subido",
          }))
        );
      }
    }
  }
  return result;
}

// Nueva función migrada
export async function getAllUsers() {
  const { data, error } = await supabase.from("profiles").select("*");
  if (error) throw error;
  return data;
}
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { supabase } from "../services/supabase";
import { useFiles } from "../context/FilesContext";
import { downloadFile } from "../services/files";
import { X, Edit, Share2, Trash2, UploadCloud, Download } from "lucide-react";
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon} from 'lucide-react';
import FileSearchBar from '../components/FileSearchBar';



interface FileItem {
  id: string;
  fileName: string; // ✅ Asegúrate que coincida con tu tabla
  path: string;
  url: string;
  uploadedAt: string;
  size: number;
  type: string;
  downloadCount?: number;
}

export default function Dashboard() {
  
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");
  const { isDark, toggleTheme } = useTheme(); 
  const { files, loading, fetchFiles } = useFiles();
  const [fullName, setFullName] = useState<string>("Usuario");

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState<{ from?: string; to?: string }>({});
  
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "date" | "size" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [uploadingFiles, setUploadingFiles] = useState<{ file: File; progress: number }[]>([]);
  

  const navigate = useNavigate();
  const dropRef = useRef<HTMLDivElement>(null);

  const clearFilters = () => {
  setSearch('');
  setFilterType('all');
  setFilterDate({});
};

 

  // --- Obtener perfil ---
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("fullname")
          .eq("id", user.id)
          .single();
        if (profile?.fullname) setFullName(profile.fullname);
      }
    };
    getProfile();
  }, []);

  // --- Convertir archivos ---
  const filesWithExtra: FileItem[] = useMemo(() => {
    return files.map(f => ({
      ...f,
      size: (f as any).size ?? 0,
      type: f.fileName.endsWith(".pdf")
        ? "pdf"
        : f.fileName.match(/\.(jpg|jpeg|png|gif)$/i)
        ? "image"
        : f.fileName.match(/\.(mp4|mov|webm)$/i)
        ? "video"
        : f.fileName.match(/\.(xlsx|xls|csv)$/i)
        ? "excel"
        : f.fileName.match(/\.(ppt|pptx)$/i)
        ? "ppt"
        : f.fileName.match(/\.(doc|docx)$/i)
        ? "word"
        : "other",
    }));
  }, [files]);

  // --- Descargar archivo (CORREGIDO) ---
const handleDownload = async (file: FileItem) => {
  try {
    // 1. Descargar el archivo de Supabase Storage como un Blob
    const { data, error: downloadError } = await supabase.storage
      .from("uploads")
      .download(file.path);

    if (downloadError) {
      console.error("Error downloading file:", downloadError);
      throw new Error("No se pudo descargar el archivo de Storage.");
    }
    
    // 2. Crear una URL local del Blob y forzar la descarga
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Liberar la URL del Blob

    // 3. Actualizar el contador de descarga
    const currentCount = file.downloadCount || 0;
    const { error: updateError } = await supabase
      .from("files")
      .update({ downloadCount: currentCount + 1 })
      .eq("id", file.id);

    if (updateError) {
      console.error("Error updating download count:", updateError);
    }

    // 4. Refrescar la lista de archivos
    await fetchFiles();
    
    toast.success("Descarga iniciada correctamente");
  } catch (err) {
    console.error("Error en descarga:", err);
    toast.error("Error al descargar el archivo");
  }
};


  // --- Renombrar archivo (CORREGIDO) ---
  const handleRename = async (file: FileItem) => {
    const newName = prompt("Nuevo nombre del archivo:", file.fileName);
    if (!newName || newName.trim() === "" || newName === file.fileName) return;

    try {
      // Validar que el ID no esté vacío
      if (!file.id || file.id.trim() === "") {
        throw new Error("ID de archivo no válido.");
      }

      // Normalizar nombre
      const normalizedNewName = newName.trim().replace(/[^a-zA-Z0-9.\s_-]/g, "_");
      
      // Crear nueva ruta
      const pathParts = file.path.split('/');
      pathParts[pathParts.length - 1] = normalizedNewName;
      const newPath = pathParts.join('/');

      // 1. Mover archivo en Storage
      const { error: moveError } = await supabase.storage
        .from("uploads")
        .move(file.path, newPath);

      if (moveError) {
        console.error("Error moving file:", moveError);
        throw new Error("No se pudo mover el archivo en el storage");
      }

      // 2. Determinar nuevo tipo
      const ext = normalizedNewName.split(".").pop()?.toLowerCase() || "";
      let type = "other";
      if (["jpg","jpeg","png","gif","webp"].includes(ext)) type = "image";
      else if (["mp4","mov","webm","avi"].includes(ext)) type = "video";
      else if (["pdf"].includes(ext)) type = "pdf";
      else if (["xls","xlsx","csv"].includes(ext)) type = "excel";
      else if (["ppt","pptx"].includes(ext)) type = "ppt";
      else if (["doc","docx"].includes(ext)) type = "word";

      // 3. Actualizar base de datos
      const { error: dbError } = await supabase
        .from("files")
        .update({
          fileName: normalizedNewName,
          path: newPath,
          type: type,
          url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/uploads/${newPath}`,
        })
        .eq("id", file.id);

      if (dbError) {
        console.error("Error updating database:", dbError);
        // Intentar revertir el movimiento del archivo
        await supabase.storage.from("uploads").move(newPath, file.path);
        throw new Error("No se pudo actualizar la base de datos");
      }

      toast.success("Archivo renombrado correctamente");
      
      // 4. Refrescar lista
      await fetchFiles();
      
    } catch (err) {
      console.error("Error renaming file:", err);
      toast.error(err instanceof Error ? err.message : "Error al renombrar el archivo");
    }
  };

  // --- Eliminar archivo (CORREGIDO) ---
  const handleDelete = async (file: FileItem) => {
    if (!file.id || file.id === ".emptyFolderPlaceholder") {
      toast.error("Este archivo no se puede eliminar.");
      setConfirmDelete(null);
      return;
    }

    try {
      // Validar que el ID no esté vacío
      if (!file.id || file.id.trim() === "") {
        throw new Error("ID de archivo no válido.");
      }

      // 1. Eliminar de la base de datos primero
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", file.id);

      if (dbError) {
        console.error("Error deleting from database:", dbError);
        throw new Error("No se pudo eliminar el registro de la base de datos");
      }

      // 2. Eliminar del storage
      const { error: storageError } = await supabase.storage
        .from("uploads")
        .remove([file.path]);

      if (storageError) {
        console.error("Error deleting from storage:", storageError);
        // El archivo ya fue eliminado de la DB, pero avisa del problema en storage
        console.warn("Archivo eliminado de la base de datos pero no del storage");
      }

      toast.success("Archivo eliminado correctamente");
      setConfirmDelete(null);
      
      // 3. Refrescar lista
      await fetchFiles();
      
    } catch (err) {
      console.error("Error deleting file:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar el archivo");
    }
  };

  // --- Compartir archivo ---
  const handleShare = async (file: FileItem) => {
    try {
      // Generar URL firmada válida por más tiempo para compartir
      const { data, error } = await supabase.storage
        .from("uploads")
        .createSignedUrl(file.path, 3600); // 1 hora

      if (error) throw error;

      await navigator.clipboard.writeText(data.signedUrl);
      toast.success("Enlace copiado al portapapeles!");
    } catch (err) {
      console.error("Error sharing file:", err);
      toast.error("Error al generar enlace para compartir");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // --- Subida de archivos (MEJORADO) ---
  const handleFilesUpload = async (selectedFiles: FileList | File[]) => {
    const filesArray = Array.from(selectedFiles);
    const newUploading = filesArray.map(file => ({ file, progress: 0 }));
    setUploadingFiles(prev => [...prev, ...newUploading]);

    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Usuario no autenticado");
      setUploadingFiles([]);
      return;
    }

    for (const uf of newUploading) {
      try {
        const ext = uf.file.name.split(".").pop()?.toLowerCase() || "";

        // Determinar tipo
        let type = "other";
        if (uf.file.type.includes("image")) type = "image";
        else if (uf.file.type.includes("video")) type = "video";
        else if (["pdf"].includes(ext)) type = "pdf";
        else if (["xls","xlsx","csv"].includes(ext)) type = "excel";
        else if (["ppt","pptx"].includes(ext)) type = "ppt";
        else if (["doc","docx"].includes(ext)) type = "word";

        // Crear ruta con timestamp único
        const timestamp = Date.now();
        const sanitizedFileName = uf.file.name.replace(/[^a-zA-Z0-9.\s_-]/g, "_");
        const filePath = `${user.id}/${timestamp}_${sanitizedFileName}`;

        // Subir a storage
        const { data, error } = await supabase.storage
          .from("uploads")
          .upload(filePath, uf.file, { 
            cacheControl: "3600", 
            upsert: false // Cambiar a false para evitar sobreescribir
          });
          
        if (error) throw error;

        // Insertar registro en tabla files con UUID
        const { error: insertError } = await supabase.from("files").insert({
          id: `${timestamp}_${sanitizedFileName}`, // Usar timestamp + nombre como ID
          fileName: uf.file.name,
          path: data.path,
          url: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/uploads/${data.path}`,
          size: uf.file.size,
          type,
          user_id: user.id,
          uploadedAt: new Date().toISOString()
        });
        
        if (insertError) throw insertError;

        toast.success(`${uf.file.name} subido correctamente`);
        
      } catch (err) {
        console.error(`Error uploading ${uf.file.name}:`, err);
        toast.error(`Error al subir ${uf.file.name}`);
      } finally {
        // Remover de la lista de subiendo
        setUploadingFiles(prev => prev.filter(p => p.file !== uf.file));
      }
    }
    
    // Refrescar lista al final
    await fetchFiles();
  };


  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

const filteredFiles = useMemo(() => {
  const list = [...filesWithExtra];

  return list
    // 🔍 Filtrado por nombre
    .filter(f => !search || f.fileName.toLowerCase().includes(search.toLowerCase()))

    // 📁 Filtrado por tipo
    .filter(f => filterType === "all" || f.type === filterType)

    // 📅 Filtrado por rango de fechas
    .filter(f => {
      const uploaded = new Date(f.uploadedAt);
      const from = filterDate.from ? new Date(filterDate.from) : null;
      const to = filterDate.to ? new Date(filterDate.to) : null;

      if (from && uploaded < from) return false;
      if (to && uploaded > to) return false;
      return true;
    })

    // 🔃 Ordenación
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return sortOrder === "asc"
            ? a.fileName.localeCompare(b.fileName)
            : b.fileName.localeCompare(a.fileName);
        case "date":
          return sortOrder === "asc"
            ? new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
            : new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        case "size":
          return sortOrder === "asc" ? a.size - b.size : b.size - a.size;
        case "type":
          return sortOrder === "asc"
            ? a.type.localeCompare(b.type)
            : b.type.localeCompare(a.type);
        default:
          return 0;
      }
    });
}, [filesWithExtra, search, filterType, filterDate, sortBy, sortOrder]);
  const formatSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;

  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }

  return `${size.toFixed(2)} ${units[i]}`;
};
const totalStorage = useMemo(() => {
  return filesWithExtra.reduce((acc, f) => acc + f.size, 0);
}, [filesWithExtra]);

const maxStorage = 100 * 1024 * 1024; // 100 MB
const storagePercent = Math.min((totalStorage / maxStorage) * 100, 100).toFixed(2);
<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
  {formatSize(totalStorage)} de {formatSize(maxStorage)} usados ({storagePercent}%)
</p>

  return (
      <div className="p-4 sm:p-6 flex flex-col min-h-screen transition-colors duration-300 bg-white dark:bg-gray-800">
    {/* --- Header --- */}
    <div className="mb-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
          Bienvenido, <span className="text-blue-600 dark:text-blue-400">{fullName}</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Gestiona tus documentos de manera profesional</p>
      </div>
      <button 
        onClick={toggleTheme} 
        className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 dark:text-gray-400 transition"
        aria-label="Alternar tema"
      >
        {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>
    </div>

      {/* --- Barra de almacenamiento --- */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div className="bg-blue-600 dark:bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${(totalStorage / maxStorage) * 100}%` }}></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{formatSize(totalStorage)} de {formatSize(maxStorage)} usados</p>
      </div>

      <div className="flex justify-end gap-2 mb-4">
  <button
    onClick={() => setViewMode("list")}
    className={`p-2 rounded-md ${viewMode === "list" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"} transition`}
    aria-label="Vista de lista"
  >
    {/* Icono de lista o tabla */}
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
  </button>
  <button
    onClick={() => setViewMode("gallery")}
    className={`p-2 rounded-md ${viewMode === "gallery" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"} transition`}
    aria-label="Vista de galería"
  >
    {/* Icono de galería o cuadrícula */}
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid-2x2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7.5 3v18"/><path d="M12 3v18"/><path d="M16.5 3v18"/></svg>
  </button>
</div>


<FileSearchBar
  search={search}
  setSearch={setSearch}
  filterType={filterType}
  setFilterType={setFilterType}
  filterDate={filterDate}
  setFilterDate={setFilterDate}
  onClear={clearFilters}
/>


      {/* --- Zona Drag & Drop --- */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className="mb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center text-gray-500 dark:text-gray-400 hover:border-blue-500 dark:hover:border-blue-400 transition cursor-pointer"
      >
        <UploadCloud size={36} className="mx-auto mb-2 text-gray-500 dark:text-gray-400" />
        <p>
          Arrastra tus archivos aquí o{" "}
          <button className="text-blue-600 dark:text-blue-400 underline" onClick={() => document.getElementById("fileInput")?.click()}>
            selecciona archivos
          </button>
        </p>
        <input type="file" id="fileInput" className="hidden" multiple onChange={(e) => handleFilesUpload(e.target.files!)} />
      </div>

      {/* --- Progreso de subida --- */}
      {uploadingFiles.length > 0 && (
        <div className="mb-4">
          {uploadingFiles.map((u) => (
            <div key={u.file.name} className="mb-1">
              <p className="text-sm text-gray-700 dark:text-gray-300">{u.file.name}</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${u.progress}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Tabla de archivos --- */}
     <div className="flex-1 rounded-xl shadow border border-gray-200 dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
  {loading ? (
    <p className="text-center py-10 text-gray-500 dark:text-gray-400">Cargando archivos...</p>
  ) : filteredFiles.length === 0 ? (
    <p className="text-center py-10 text-gray-500 dark:text-gray-400">No hay archivos que coincidan</p>
  ) : (
    <>
      {viewMode === "list" && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-left text-gray-700 dark:text-gray-300 text-sm uppercase">
                {["Archivo", "Fecha", "Tamaño", "Tipo", "Acciones"].map((h, i) => (
                  <th key={i} className="px-4 py-3 cursor-pointer"
                    onClick={() => {
                      if (h === "Archivo") setSortBy("name");
                      if (h === "Fecha") setSortBy("date");
                      if (h === "Tamaño") setSortBy("size");
                      if (h === "Tipo") setSortBy("type");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFiles.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-4 py-3 flex items-center gap-2 text-gray-800 dark:text-white">
                    {f.type === "pdf" && <span className="text-red-500 font-bold">📄</span>}
                    {f.type === "image" && <img src={f.url} alt={f.fileName} className="w-8 h-8 object-cover rounded" />}
                    {f.type === "video" && <span className="text-purple-500 font-bold">🎬</span>}
                    {f.type === "excel" && <span className="text-green-700 font-bold">📊</span>}
                    {f.type === "ppt" && <span className="text-orange-600 font-bold">📈</span>}
                    {f.type === "word" && <span className="text-blue-600 font-bold">📝</span>}
                    {f.fileName}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{f.uploadedAt}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{formatSize(f.size)}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{f.type}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => handleDownload(f)} className="px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600">Descargar</button>
                    <button onClick={() => window.open(f.url, '_blank')} className="px-2 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600">Ver</button>
                    <button onClick={() => handleRename(f)} className="px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-1"><Edit size={14} />Renombrar</button>
                    <button onClick={() => handleShare(f)} className="px-2 py-1 rounded bg-purple-500 text-white hover:bg-purple-600 flex items-center gap-1"><Share2 size={14} />Compartir</button>
                    <button onClick={() => setConfirmDelete(f)} className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 flex items-center gap-1"><Trash2 size={14} />Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "gallery" && (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 overflow-y-auto max-h-[80vh]">
    {filteredFiles.map((f) => (

      <div
        key={f.id}
        className="relative group rounded-lg overflow-hidden shadow-md cursor-pointer transform hover:scale-105 transition-transform duration-200"
      >
        {/* --- Vista previa clickeable --- */}
        <div
          onClick={() => window.open(f.url, '_blank')}
          className="relative w-full h-32 flex items-center justify-center bg-gray-200 dark:bg-gray-700"
        >
          {f.type === "image" ? (
            <img src={f.url} alt={f.fileName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl text-gray-500 dark:text-gray-400">
              {f.type === "pdf" && "📄"}
              {f.type === "video" && "🎬"}
              {f.type === "excel" && "📊"}
              {f.type === "ppt" && "📈"}
              {f.type === "word" && "📝"}
              {f.type === "other" && "📁"}
            </span>
          )}
        </div>

        {/* --- Overlay con info y acciones --- */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-sm font-semibold truncate">{f.fileName}</p>
          <p className="text-xs text-gray-300">{formatSize(f.size)}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(f);
              }}
              className="p-1 rounded-full bg-blue-500 hover:bg-blue-600"
              title="Descargar"
            >
              <Download size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(f);
              }}
              className="p-1 rounded-full bg-red-500 hover:bg-red-600"
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    ))}
  </div>
)}
    </>
  )}
</div>

      {/* --- Modal Confirmación eliminar --- */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-11/12 max-w-md relative text-center">
            <p className="mb-4 text-gray-700 dark:text-gray-300">¿Seguro que deseas eliminar <strong>{confirmDelete.fileName}</strong>?</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => handleDelete(confirmDelete!)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Eliminar</button>
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium shadow hover:bg-red-600 transition">Salir de la sesión</button>
      </div>
    </div>
  );
}
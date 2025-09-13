// src/pages/Upload.tsx
import { useRef, useState } from "react";
import { uploadFile } from "../services/storage";
import { toast } from "react-toastify";
import { supabase } from "../services/supabase";
import { useFiles } from "../context/FilesContext";
import { ArrowLeft, UploadCloud } from "lucide-react";

export default function Upload() {
 const fileInput = useRef<HTMLInputElement>(null);
 const [loading, setLoading] = useState(false);
 const [selectedFileName, setSelectedFileName] = useState<string | null>(null); // ✅ Esta línea está bien

 // ✅ La función para manejar el cambio en el input de archivo está en el lugar correcto.
 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 if (e.target.files && e.target.files.length > 0) {
 setSelectedFileName(e.target.files[0].name);
 } else {
 setSelectedFileName(null);
 }
 };

 // Obtiene la función para recargar los archivos desde el contexto
 const { fetchFiles } = useFiles();

 const handleUpload = async (e: React.FormEvent) => {
 e.preventDefault();

 if (!fileInput.current?.files || fileInput.current.files.length === 0) {
 toast.error("Por favor, selecciona un archivo.");
 return;
 }

 const file = fileInput.current.files[0];

 // Validar tamaño máximo (50MB)
 if (file.size > 50 * 1024 * 1024) {
 toast.error("El archivo no debe superar los 50 MB.");
 return;
 }

 // Validar tipo de archivo
 const allowedTypes = [
 "image/png",
 "image/jpeg",
 "application/pdf",
 "application/vnd.ms-excel",
 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
 "application/vnd.ms-powerpoint",
 "application/vnd.openxmlformats-officedocument.presentationml.presentation",
 "video/mp4",
 "audio/mpeg",
 ];

 if (!allowedTypes.includes(file.type)) {
 toast.error("Tipo de archivo no permitido.");
 return;
 }

 const {
 data: { user },
 } = await supabase.auth.getUser();

 if (!user) {
 toast.error("Debes iniciar sesión para subir archivos.");
 return;
 }

 setLoading(true);
 try {
 await uploadFile(user.id, file);
 toast.success("Archivo subido exitosamente.");

 await fetchFiles();

 if (fileInput.current) {
 fileInput.current.value = "";
 }
 setSelectedFileName(null); // ✅ Esta línea faltaba para limpiar el estado
 } catch (err) {
 toast.error("Error al subir archivo");
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
 <form
 className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8 space-y-6"
 onSubmit={handleUpload}
 >
 <div className="text-center">
 <h2 className="text-2xl font-bold text-gray-800 mb-2">
 Subir nuevo archivo
 </h2>
 <p className="text-sm text-gray-500">
 Puedes subir imágenes, documentos, hojas de cálculo, presentaciones
 o videos (máx. 50 MB)
 </p>
 </div>

 <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-blue-400 transition">
 <UploadCloud className="h-12 w-12 text-gray-400 mb-3" />
 <label
 htmlFor="upload-file"
 className="cursor-pointer text-blue-600 hover:underline"
 >
 Selecciona un archivo
 </label>
 
 {selectedFileName && ( // ✅ Esta sección está bien
 <span className="mt-2 text-sm text-gray-600">
 Archivo seleccionado: {selectedFileName}
 </span>
 )}

 <input
 id="upload-file"
 ref={fileInput}
 type="file"
 className="hidden"
 accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mp3"
 required
 onChange={handleFileChange} // ✅ Esta sección está bien
 />
 </div>

 <button
 className="w-full bg-blue-600 text-white py-2 px-4 rounded-xl shadow hover:bg-blue-500 transition disabled:bg-gray-400"
 type="submit"
 disabled={loading}
 >
 {loading ? "Subiendo..." : "Subir archivo"}
 </button>

 <button
 type="button"
 onClick={() => window.history.back()}
 className="flex items-center justify-center w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-xl shadow hover:bg-gray-300 transition"
 >
 <ArrowLeft className="w-5 h-5 mr-2" />
 Regresar al dashboard
 </button>
 </form>
 </div>
 );
}
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { getUserFiles } from '../services/files';

// 1. Define la interfaz de los datos de un archivo.
interface FileData {
  id: string;
  fileName: string;
  uploadedAt: string;
  url: string;
  path: string;
  size?: number;
  type?: string;
  downloadCount?: number;
}

// 2. Define la interfaz de los valores que el contexto proporcionará.
interface FilesContextValue {
  files: FileData[];
  fetchFiles: () => Promise<void>;
  loading: boolean;
}

// 3. Crea el contexto y dale un valor por defecto que cumpla con la interfaz.
const FilesContext = createContext<FilesContextValue>({
  files: [],
  fetchFiles: async () => {},
  loading: true,
});

// 4. Tipa las props del proveedor correctamente.
interface FilesProviderProps {
  children: ReactNode;
}

// 5. Crea el proveedor que envolverá tu aplicación.
export const FilesProvider = ({ children }: FilesProviderProps) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);

  // 6. Función para obtener los archivos del usuario.
  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userFiles = await getUserFiles(user.id);
        setFiles(userFiles);
      }
    } catch (error) {
      console.error("Error al obtener archivos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <FilesContext.Provider value={{ files, fetchFiles, loading }}>
      {children}
    </FilesContext.Provider>
  );
};

// 7. Crea un hook personalizado.
export const useFiles = () => useContext(FilesContext);
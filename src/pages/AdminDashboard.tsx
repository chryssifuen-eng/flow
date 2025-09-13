import React, { useState, useEffect, useMemo } from 'react';
import { getAllFiles, getAllUsers, deleteFileAsAdmin, getSystemStats, getRecentActivity } from "../services/admin";
import { supabase } from "../services/supabase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Files, 
  Download, 
  Upload, 
  Activity, 
  Search, 
  Eye,
  Edit,
  Trash2,
  UserPlus,
  TrendingUp,
  Calendar,
  Bell,
  LogOut,
  Shield,
  Database,
  HardDrive,
  Clock,
  Filter,
  MoreVertical,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface FileItem {
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

interface UserProfile {
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

interface SystemStats {
  totalUsers: number;
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  recentUploads: number;
}

export default function AdminDashboard() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalFiles: 0,
    totalSize: 0,
    totalDownloads: 0,
    recentUploads: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'files' | 'activity'>('overview');
  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);
  const [adminName, setAdminName] = useState<string>("Administrador");

  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
    getAdminProfile();
  }, []);

  const getAdminProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("fullname")
          .eq("id", user.id)
          .single();
        if (profile?.fullname) setAdminName(profile.fullname);
      }
    } catch (error) {
      console.error("Error getting admin profile:", error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [filesData, usersData, statsData, activityData] = await Promise.all([
        getAllFiles(),
        getAllUsers(),
        getSystemStats(),
        getRecentActivity()
      ]);
      
      setFiles(filesData);
      setUsers(usersData);
      setStats(statsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (file: FileItem) => {
    try {
      await deleteFileAsAdmin(file.id, file.path);
      toast.success(`Archivo "${file.fileName}" eliminado correctamente`);
      setConfirmDelete(null);
      await fetchAllData(); // Recargar datos
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Error al eliminar el archivo');
    }
  };

  const handleDownloadFile = async (file: FileItem) => {
    try {
      // Descargar archivo usando la URL pública
      const response = await fetch(file.url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Actualizar contador de descarga
      const { error } = await supabase
        .from("files")
        .update({ downloadcount: file.downloadCount + 1 })
        .eq("id", file.id);

      if (!error) {
        await fetchAllData(); // Recargar para mostrar el contador actualizado
      }

      toast.success('Descarga iniciada correctamente');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  // Crear un mapa de usuarios para búsquedas rápidas
  const userMap = useMemo(() => {
    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, UserProfile>);
  }, [users]);

  // Filtrar archivos por búsqueda
  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const user = userMap[file.userId];
      const searchLower = searchTerm.toLowerCase();
      return (
        file.fileName.toLowerCase().includes(searchLower) ||
        (user && user.fullname.toLowerCase().includes(searchLower)) ||
        (user && user.email.toLowerCase().includes(searchLower))
      );
    });
  }, [files, userMap, searchTerm]);

  // Filtrar usuarios por búsqueda
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeenumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'video': return '🎬';
      case 'excel': return '📊';
      case 'ppt': return '📈';
      case 'word': return '📝';
      default: return '📁';
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, icon: Icon, active }: {
    id: string;
    label: string;
    icon: any;
    active: boolean;
  }) => (
    <button
      onClick={() => setSelectedTab(id as any)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Dashboard de Administración</h1>
                  <p className="text-sm text-gray-500">Bienvenido, {adminName}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-white p-1 rounded-lg shadow-sm border border-gray-200">
          <TabButton id="overview" label="Resumen" icon={Activity} active={selectedTab === 'overview'} />
          <TabButton id="users" label="Usuarios" icon={Users} active={selectedTab === 'users'} />
          <TabButton id="files" label="Archivos" icon={Files} active={selectedTab === 'files'} />
          <TabButton id="activity" label="Actividad" icon={Clock} active={selectedTab === 'activity'} />
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                icon={Users}
                title="Total Usuarios"
                value={stats.totalUsers}
                subtitle="Usuarios registrados"
                color="bg-blue-500"
              />
              <StatCard
                icon={Files}
                title="Total Archivos"
                value={stats.totalFiles}
                subtitle={formatFileSize(stats.totalSize)}
                color="bg-green-500"
              />
              <StatCard
                icon={Download}
                title="Descargas"
                value={stats.totalDownloads}
                subtitle="Descargas totales"
                color="bg-purple-500"
              />
              <StatCard
                icon={Upload}
                title="Subidas Recientes"
                value={stats.recentUploads}
                subtitle="Última semana"
                color="bg-orange-500"
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Upload className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          Archivo subido: {activity.filename}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.profiles?.fullname} ({activity.profiles?.email})
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {selectedTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
              <div className="text-sm text-gray-500">
                Total: {filteredUsers.length} usuarios
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Información
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const userFiles = files.filter(f => f.userId === user.id);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <Users className="w-5 h-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.fullname}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <p>Empleado: {user.employeenumber}</p>
                            <p>Taller: {user.workshop}</p>
                            <p>Zona: {user.zone}</p>
                            <p>Teléfono: {user.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {userFiles.length} archivos
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdat)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Files Tab */}
        {selectedTab === 'files' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Gestión de Archivos</h3>
              <div className="text-sm text-gray-500">
                Total: {filteredFiles.length} archivos
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de subida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tamaño
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descargas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFiles.map(file => {
                    const user = userMap[file.userId];
                    return (
                      <tr key={file.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{getFileIcon(file.type)}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{file.fileName}</div>
                              <div className="text-sm text-gray-500">{file.type.toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user ? (
                            <div>
                              <div className="font-medium">{user.fullname}</div>
                              <div className="text-gray-500">{user.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Usuario no encontrado</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {file.uploadedAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Download className="w-4 h-4 text-gray-400 mr-1" />
                            {file.downloadCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => window.open(file.url, '_blank')}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="Ver archivo"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDownloadFile(file)}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setConfirmDelete(file)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Eliminar archivo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {selectedTab === 'activity' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Registro de Actividad Completo</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">
                          Archivo subido: {activity.filename}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {formatDate(activity.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Usuario: {activity.profiles?.fullname} ({activity.profiles?.email})
                      </p>
                      <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          Subida exitosa
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-11/12 max-w-md relative">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirmar eliminación
              </h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar el archivo{' '}
                <strong>"{confirmDelete.fileName}"</strong>?
                <br />
                <span className="text-sm text-red-500">Esta acción no se puede deshacer.</span>
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => handleDeleteFile(confirmDelete)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// src/components/ProtectedRoute.tsx
import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly }: ProtectedRouteProps) => {
  const { user, isAuthenticated } = useUser();

  // Loader mientras se verifica
  if (user === null && isAuthenticated === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-gray-500 text-lg animate-pulse">Verificando acceso...</span>
      </div>
    );
  }

  // Redirige si no está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  // Redirige si no tiene rol de admin
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  // Acceso permitido
  return <>{children}</>;
};

export default ProtectedRoute;
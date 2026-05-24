import React from 'react';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  userRole: UserRole | null;
  onAccessDenied: () => void;
}

/**
 * Componente Master para proteger rutas.
 * Si el usuario no tiene el rol necesario, bloquea el acceso.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  userRole, 
  onAccessDenied 
}) => {
  
  if (!userRole) {
    // No ha iniciado sesión
    return null; 
  }

  if (!allowedRoles.includes(userRole)) {
    // Tiene sesión pero no tiene permiso para esta pantalla
    setTimeout(() => onAccessDenied(), 0);
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl text-center max-w-md">
          <h2 className="text-2xl font-bold text-rose-500 mb-2">Acceso Restringido</h2>
          <p className="text-slate-400">Tu cuenta ({userRole}) no tiene permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

const normalizeRole = (role: string): string[] => {
  if (!role) return [];
  const r = role.toLowerCase();
  if (r === 'buyer' || r === 'comprador') return ['buyer', 'comprador'];
  if (r === 'seller' || r === 'vendedor') return ['seller', 'vendedor'];
  if (r === 'admin' || r === 'administrador') return ['admin', 'administrador'];
  if (r === 'inspector') return ['inspector'];
  return [r];
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }
    
    // Support user.role or user.rol
    const userRoleValue = user.role || user.rol || '';
    const userRoles = normalizeRole(userRoleValue);
    
    return requiredRoles.some(reqRole => {
      const normalizedReq = normalizeRole(reqRole);
      return normalizedReq.some(norm => userRoles.includes(norm));
    });
  }
}

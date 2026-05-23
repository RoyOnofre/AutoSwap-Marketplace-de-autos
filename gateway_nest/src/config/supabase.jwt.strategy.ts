import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Estrategia que valida los tokens JWT emitidos por Supabase.
 * Utiliza la clave pública (o el secret) configurada en la variable de entorno
 * `SUPABASE_JWT_SECRET`. La estrategia extrae el token del encabezado
 * `Authorization: Bearer <token>` y, si es válido, adjunta el `user_id`
 * al request bajo `request.user`.
 */
@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, 'supabase-jwt') {
  constructor() {
    super({
      // Extraer token del header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // No se valida la expiración aquí; jsonwebtoken lo hace automáticamente.
      ignoreExpiration: false,
      // La clave secreta o pública se provee vía variable de entorno.
      secretOrKey: process.env.SUPABASE_JWT_SECRET || 'placeholder_secret',
    });
  }

  /**
   * Valida el payload del JWT y devuelve la información del usuario.
   * Supabase incluye el `sub` que corresponde al `user_id`.
   */
  async validate(payload: any) {
    // payload típicamente tiene { aud, sub, role, exp, iat, ... }
    const userId = payload.sub;
    return { userId, ...payload };
  }

  /**
   * Método opcional que permite validar el token manualmente
   * (por ejemplo en pruebas unitarias).
   */
  verifyToken(token: string) {
    const secret = process.env.SUPABASE_JWT_SECRET || 'placeholder_secret';
    return jwt.verify(token, secret);
  }

}

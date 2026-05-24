import { Controller, Post, Body, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Public } from './public.decorator';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  @Public()
  @Post('login')
  async login(@Body() body: any) {
    this.logger.debug(`Received login body: ${JSON.stringify(body)}`);
    const { correo, contrasena } = body;

    try {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8004/api';
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.usuario;

        const token = jwt.sign(
          { userId: user.id, role: user.rol, email: user.correo },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '24h' }
        );

        return {
          mensaje: 'Login exitoso',
          usuario: user,
          token,
        };
      } else {
        const errData = await response.json().catch(() => ({ detail: 'Credenciales incorrectas' }));
        throw new BadRequestException(errData.detail || 'Credenciales incorrectas');
      }
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error('Authentication backend unreachable or returned an unexpected error', error?.message || error);
      throw new InternalServerErrorException('Servicio de autenticación no disponible. Intenta de nuevo más tarde.');
    }
  }
}

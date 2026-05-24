import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({ secret: 'test', signOptions: { expiresIn: '1h' } })],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}

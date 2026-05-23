import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags('Escrow')
@ApiBearerAuth()
@Controller('v1/escrow')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EscrowController {
  constructor(private readonly escrowService: EscrowService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un fondo en custodia (escrow)' })
  @ApiResponse({ status: 200, description: 'Detalles del escrow' })
  @ApiResponse({ status: 404, description: 'Escrow no encontrado' })
  async getEscrow(@Param('id') id: string) {
    return this.escrowService.findOne(id);
  }

  @Post(':id/release')
  @Roles('admin', 'comprador')
  @ApiOperation({ summary: 'Liberar fondos de escrow al vendedor (comprador o admin)' })
  @ApiResponse({ status: 200, description: 'Fondos liberados exitosamente' })
  async releaseEscrow(@Param('id') id: string) {
    return this.escrowService.releaseFunds(id);
  }

  @Post(':id/refund')
  @Roles('admin')
  @ApiOperation({ summary: 'Reembolsar fondos de escrow al comprador (solo admin)' })
  @ApiResponse({ status: 200, description: 'Fondos reembolsados exitosamente' })
  async refundEscrow(@Param('id') id: string) {
    return this.escrowService.refundFunds(id);
  }
}

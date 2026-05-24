import { Controller, Get, Post, Body, Param, UseGuards, Request, ParseFloatPipe } from '@nestjs/common';
import { InspectionService } from './inspection.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';


@ApiTags('Inspections')
@ApiBearerAuth()
@Controller('inspections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InspectionController {
  constructor(private readonly inspectionService: InspectionService) {}

  @Post()
  @Roles('inspector', 'admin')
  @ApiOperation({ summary: 'Registrar una inspección técnica de un vehículo (inspector o admin)' })
  @ApiResponse({ status: 201, description: 'Inspección técnica registrada exitosamente' })
  async createInspection(@Request() req: any, @Body() body: any) {
    const inspectorId = req.user.userId;
    return this.inspectionService.createInspection(inspectorId, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener los detalles de una inspección por ID' })
  @ApiResponse({ status: 200, description: 'Detalles de la inspección técnica' })
  @ApiResponse({ status: 404, description: 'Inspección no encontrada' })
  async getInspection(@Param('id') id: string) {
    return this.inspectionService.findOne(id);
  }

  @Get('verify/:vehicleId/:price')
  @ApiOperation({ summary: 'Verificar si un vehículo requiere inspección técnica y si ya pasó' })
  @ApiResponse({ status: 200, description: 'Información sobre el requerimiento y paso de la inspección' })
  async verifyInspection(
    @Param('vehicleId') vehicleId: string,
    @Param('price', ParseFloatPipe) price: number,
  ) {
    return this.inspectionService.verifyInspectionRequirement(vehicleId, price);
  }
}

import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Roles('buyer')
  @Post()
  @ApiOperation({ summary: 'Crear una nueva transacción de compra (comprador)' })
  @ApiResponse({ status: 201, description: 'Transacción creada exitosamente' })
  async create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Roles('buyer', 'seller')
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una transacción por ID' })
  @ApiResponse({ status: 200, description: 'Detalles de la transacción' })
  @ApiResponse({ status: 404, description: 'Transacción no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Roles('buyer')
  @Post(':id/pay')
  @ApiOperation({ summary: 'Iniciar la sesión de pago para una transacción' })
  @ApiResponse({ status: 200, description: 'Sesión de pago generada exitosamente' })
  @ApiResponse({ status: 400, description: 'Error al generar la sesión de pago o falta inspección' })
  async pay(@Param('id') id: string, @Body() dto: PayTransactionDto) {
    return this.transactionsService.createPaymentSession(id, dto);
  }
}

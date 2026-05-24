import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PayTransactionDto } from '../transactions/dto/pay-transaction.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';

@ApiTags('Payments')
@Public()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('session')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una sesión de pago para una transacción' })
  @ApiResponse({ status: 201, description: 'Sesión de pago generada exitosamente' })
  async createPaymentSession(@Body() dto: PayTransactionDto) {
    return this.paymentsService.createSession(dto);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Procesar el webhook de notificaciones de la pasarela de pago' })
  @ApiResponse({ status: 200, description: 'Webhook recibido y procesado' })
  async handleWebhook(@Headers() headers: Record<string, any>, @Body() payload: any) {
    return this.paymentsService.processWebhook(headers, payload);
  }
}

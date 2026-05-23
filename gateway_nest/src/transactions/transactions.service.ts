import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { supabase } from '../supabase/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { PayTransactionDto } from './dto/pay-transaction.dto';

@Injectable()
export class TransactionsService {
  /** Create a transaction record in Supabase */
  async create(dto: CreateTransactionDto) {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        listing_id: dto.listingId,
        amount: dto.amount,
        notes: dto.notes,
        status: 'pending'
      })
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Find a transaction by ID */
  async findOne(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Transacción no encontrada');
    }
    return data;
  }

  /** Generate a payment session (placeholder for local gateway integration) */
  async createPaymentSession(transactionId: string, dto: PayTransactionDto) {
    // Verify transaction exists and is pending
    const tx = await this.findOne(transactionId);
    if (tx.status !== 'pending') {
      throw new BadRequestException('La transacción ya no está pendiente');
    }

    // Validación de inspección obligatoria en Bolivia (precio >= 140,000 Bs.)
    if (tx.amount >= 140000) {
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('*')
        .eq('vehicle_id', tx.listing_id)
        .eq('status', 'approved');

      if (inspError || !inspections || inspections.length === 0) {
        throw new BadRequestException(
          'El vehículo requiere de forma obligatoria pasar la inspección técnica antes de proceder al pago, ya que su precio es mayor o igual a 140,000 Bs.'
        );
      }
    }

    // Simulamos una respuesta de creación de sesión de pago en Bs.
    const paymentSession = {
      id: `session_${transactionId}_${Date.now()}`,
      amount: tx.amount,
      currency: 'BOB', // Bs.
      payment_url: `https://checkout.autoswap.bo/pay/${transactionId}`,
    };

    // Guardamos el id de la sesión en la tabla para correlacionar el webhook.
    await supabase
      .from('transactions')
      .update({ payment_session_id: paymentSession.id })
      .eq('id', transactionId);

    return paymentSession;
  }

  /** Process webhook from the payment gateway */
  async handleWebhook(payload: any) {
    const { transactionId, status, amount } = payload;
    if (!transactionId) throw new BadRequestException('Falta transactionId');

    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: status === 'paid' ? 'paid' : 'failed',
        paid_at: new Date().toISOString()
      })
      .eq('id', transactionId)
      .single();

    if (error) throw new BadRequestException(error.message);

    // Si está pagado, iniciar escrow (creamos registro en escrow table)
    if (status === 'paid') {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // 72h

      await supabase.from('escrows').insert({
        transaction_id: transactionId,
        amount,
        status: 'funded',
        expires_at: expiresAt.toISOString(),
      });
    }

    return data;
  }
}

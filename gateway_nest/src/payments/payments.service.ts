import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { supabase } from '../supabase/client';
import { PayTransactionDto } from '../transactions/dto/pay-transaction.dto';

@Injectable()
export class PaymentsService {
  async createSession(dto: any) {
    // Basic session creation simulation
    const transactionId = dto.transactionId || 'tx_test_123';
    const amount = dto.amount || 500;
    
    const session = {
      id: `session_${transactionId}_${Date.now()}`,
      amount,
      currency: 'BOB', // Bolivianos
      payment_url: `https://checkout.autoswap.bo/pay/${transactionId}`,
      status: 'pending'
    };

    // Store payment session on transaction if valid transactionId
    if (dto.transactionId) {
      await supabase
        .from('transactions')
        .update({ payment_session_id: session.id, status: 'pending' })
        .eq('id', transactionId);
    }

    return session;
  }

  async processWebhook(headers: Record<string, any>, payload: any) {
    // Process webhook from gateway
    const { transaction_id, status, amount } = payload;
    if (!transaction_id) {
      throw new BadRequestException('Falta transaction_id en el payload');
    }

    // Update status in transactions
    const { data: tx, error } = await supabase
      .from('transactions')
      .update({
        status: status === 'paid' ? 'paid' : 'failed',
        paid_at: new Date().toISOString()
      })
      .eq('id', transaction_id)
      .single();

    if (error) {
      throw new BadRequestException(`Error al actualizar transacción: ${error.message}`);
    }

    // If paid, create escrow hold
    if (status === 'paid') {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours hold

      await supabase.from('escrows').insert({
        transaction_id,
        amount,
        status: 'funded',
        expires_at: expiresAt.toISOString(),
      });

      // Add in-app notification for the buyer and seller
      await supabase.from('notifications').insert([
        {
          user_id: payload.buyer_id || 'buyer_placeholder',
          title: 'Pago Recibido (Escrow)',
          message: `Tu pago de ${amount} Bs. está retenido de forma segura en garantía por 72h.`,
          type: 'success',
          read: false
        },
        {
          user_id: payload.seller_id || 'seller_placeholder',
          title: 'Fondo de Escrow Financiado',
          message: `El comprador ha pagado ${amount} Bs. Los fondos están garantizados y se liberarán en 72 horas.`,
          type: 'info',
          read: false
        }
      ]);
    }

    return { received: true, status };
  }
}

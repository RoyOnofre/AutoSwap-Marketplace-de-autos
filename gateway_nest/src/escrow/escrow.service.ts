import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { supabase } from '../supabase/client';

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  /** Create an escrow entry */
  async createEscrow(transactionId: string, amount: number) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72-hour window

    const { data, error } = await supabase
      .from('escrows')
      .insert({
        transaction_id: transactionId,
        amount,
        status: 'funded',
        expires_at: expiresAt.toISOString()
      })
      .single();

    if (error) {
      this.logger.error(`Error creating escrow: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    return data;
  }

  /** Find escrow by ID */
  async findOne(id: string) {
    const { data, error } = await supabase
      .from('escrows')
      .select('*, transactions(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Fondo de garantía (escrow) no encontrado');
    }
    return data;
  }

  /** Release escrow funds to the seller */
  async releaseFunds(id: string) {
    const escrow = await this.findOne(id);
    if (escrow.status !== 'funded') {
      throw new BadRequestException('El escrow no está en estado financiado (funded)');
    }

    const { data, error } = await supabase
      .from('escrows')
      .update({ status: 'released', released_at: new Date().toISOString() })
      .eq('id', id)
      .single();

    if (error) throw new BadRequestException(error.message);

    // Update corresponding transaction status to 'completed'
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', escrow.transaction_id);

    // Trigger in-app notifications
    await supabase.from('notifications').insert([
      {
        user_id: escrow.transactions?.seller_id || 'seller_placeholder',
        title: 'Fondos Liberados',
        message: `El escrow ha sido liberado. Se han transferido ${escrow.amount} Bs. a tu cuenta.`,
        type: 'success',
        read: false
      },
      {
        user_id: escrow.transactions?.buyer_id || 'buyer_placeholder',
        title: 'Compra Completada',
        message: `El escrow para tu compra fue liberado con éxito.`,
        type: 'info',
        read: false
      }
    ]);

    return { message: 'Fondos liberados exitosamente', data };
  }

  /** Refund escrow funds to the buyer */
  async refundFunds(id: string) {
    const escrow = await this.findOne(id);
    if (escrow.status !== 'funded') {
      throw new BadRequestException('El escrow no está en estado financiado (funded)');
    }

    const { data, error } = await supabase
      .from('escrows')
      .update({ status: 'refunded', refunded_at: new Date().toISOString() })
      .eq('id', id)
      .single();

    if (error) throw new BadRequestException(error.message);

    // Update corresponding transaction status to 'refunded'
    await supabase
      .from('transactions')
      .update({ status: 'refunded' })
      .eq('id', escrow.transaction_id);

    // Trigger in-app notifications
    await supabase.from('notifications').insert([
      {
        user_id: escrow.transactions?.buyer_id || 'buyer_placeholder',
        title: 'Reembolso Procesado',
        message: `Se ha reembolsado ${escrow.amount} Bs. a tu cuenta de origen.`,
        type: 'success',
        read: false
      },
      {
        user_id: escrow.transactions?.seller_id || 'seller_placeholder',
        title: 'Escrow Reembolsado',
        message: `La transacción fue cancelada y el escrow de ${escrow.amount} Bs. se devolvió al comprador.`,
        type: 'warning',
        read: false
      }
    ]);

    return { message: 'Fondos reembolsados exitosamente', data };
  }

  /** Run periodic cleanup: find all expired escrows in 'funded' state and release to seller */
  async autoReleaseExpiredEscrows() {
    const now = new Date().toISOString();
    
    // Select expired funded escrows
    const { data: expiredEscrows, error } = await supabase
      .from('escrows')
      .select('*, transactions(*)')
      .eq('status', 'funded')
      .lt('expires_at', now);

    if (error) {
      this.logger.error(`Error fetching expired escrows: ${error.message}`);
      return;
    }

    if (!expiredEscrows || expiredEscrows.length === 0) {
      return;
    }

    this.logger.log(`Procesando liberación automática para ${expiredEscrows.length} escrows vencidos.`);

    for (const escrow of expiredEscrows) {
      try {
        await this.releaseFunds(escrow.id);
        this.logger.log(`Escrow ${escrow.id} auto-liberado por expiración de 72h.`);
      } catch (err) {
        this.logger.error(`Error en auto-liberación de escrow ${escrow.id}: ${err.message}`);
      }
    }
  }
}

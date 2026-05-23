import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EscrowService } from './escrow.service';

@Injectable()
export class EscrowCleanupService {
  private readonly logger = new Logger(EscrowCleanupService.name);

  constructor(private readonly escrowService: EscrowService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Ejecutando limpieza de fondos de garantía (escrow) expirados...');
    await this.escrowService.autoReleaseExpiredEscrows();
  }
}

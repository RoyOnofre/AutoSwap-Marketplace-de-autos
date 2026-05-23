import { Module } from '@nestjs/common';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { EscrowCleanupService } from './escrow-cleanup.service';

@Module({
  controllers: [EscrowController],
  providers: [EscrowService, EscrowCleanupService],
  exports: [EscrowService]
})
export class EscrowModule {}

import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { APP_GUARD } from '@nestjs/core';

@Module({
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    // Apply JWT guard globally to this module
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class TransactionsModule {}

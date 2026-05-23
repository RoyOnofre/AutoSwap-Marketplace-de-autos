import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KycModule } from './kyc/kyc.module';
import { PaymentsModule } from './payments/payments.module';
import { EscrowModule } from './escrow/escrow.module';
import { InspectionModule } from './inspection/inspection.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    KycModule,
    PaymentsModule,
    EscrowModule,
    InspectionModule,
    TransactionsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


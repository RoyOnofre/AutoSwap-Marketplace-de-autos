import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { KycModule } from './kyc/kyc.module';
import { PaymentsModule } from './payments/payments.module';
import { EscrowModule } from './escrow/escrow.module';
import { InspectionModule } from './inspection/inspection.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    KycModule,
    PaymentsModule,
    EscrowModule,
    InspectionModule,
    TransactionsModule,
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({ secret: 'test', signOptions: { expiresIn: '1h' } }),
  ],
  controllers: [AppController],
  providers: [AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}


import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ListingsController } from './listings.controller';
import { AdminListingsController } from './admin-listings.controller';
import { ListingsService } from './listings.service';
import { ListingsRepository } from './listings.repository';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { AuthModule } from '../../auth/auth.module';
import { ListingOwnerGuard } from './guards/listing-owner.guard';
@Module({
  imports: [CacheModule.register({ ttl: 300 }), AuthModule],
  controllers: [ListingsController, AdminListingsController],
  providers: [ListingsService, ListingsRepository, JwtAuthGuard, RolesGuard, ListingOwnerGuard],
  exports: [ListingsService],
})
export class ListingsModule {}

import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import type { Request } from 'express';
import { RejectListingDto } from './dto/reject-listing.dto';

@ApiTags('admin-listings')
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener anuncios pendientes de validación' })
  async getPending(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query() filters: any,
  ) {
    const p = parseInt(page, 10) || 1;
    const l = parseInt(limit, 10) || 12;
    return this.listingsService.getPendingForAdmin(p, l, filters);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aprobar un anuncio' })
  async approve(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const adminId = (req.user as any).id;
    return this.listingsService.approveListing(id, adminId);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechazar un anuncio con motivo' })
  async reject(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() dto: RejectListingDto,
  ) {
    const adminId = (req.user as any).id;
    return this.listingsService.rejectListing(id, adminId, dto.reason);
  }
}

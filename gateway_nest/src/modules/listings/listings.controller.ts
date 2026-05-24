import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ListingOwnerGuard } from './guards/listing-owner.guard';
import type { Request } from 'express';
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Vehicle } from './entities/vehicle.entity';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo anuncio' })
  async create(@Req() req: Request, @Body() dto: CreateListingDto) {
    const userId = (req.user as any).id;
    return this.listingsService.createListing(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Buscar anuncios con filtros' })
  async findAll(@Query() query: SearchListingsDto) {
    return this.listingsService.getListings(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un anuncio por ID' })
  async findOne(@Param('id') id: string) {
    return this.listingsService.getListingById(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener mis anuncios' })
  async myListings(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.listingsService.getMyListings(userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, ListingOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un anuncio propio' })
  async update(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateListingDto) {
    const userId = (req.user as any).id;
    return this.listingsService.updateListing(id, userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, ListingOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar (soft) un anuncio propio' })
  async remove(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    await this.listingsService.deleteListing(id, userId);
    return { message: 'Anuncio eliminado' };
  }

  @Get(':id/upload-urls')
  @UseGuards(JwtAuthGuard, ListingOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener URLs firmadas para subir fotos' })
  async getUploadUrls(@Param('id') id: string, @Req() req: Request, @Query('count') count: string) {
    const userId = (req.user as any).id;
    const cnt = parseInt(count, 10) || 1;
    return this.listingsService.getUploadUrls(id, userId, cnt);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard, ListingOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirmar subida de foto' })
  async confirmPhoto(@Param('id') id: string, @Req() req: Request, @Body() photoData: any) {
    const userId = (req.user as any).id;
    return this.listingsService.confirmPhotoUpload(id, userId, photoData);
  }
}

import { Controller, Post, UseGuards, Body, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { KycService } from './kyc.service';
import { KycSubmitDto } from './dto/kyc-submit.dto';
import { supabase } from '../../supabase/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('KYC')
@ApiBearerAuth()
@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Subir documentos de identidad y selfie para KYC en formato Base64' })
  @ApiResponse({ status: 201, description: 'Documentos subidos y en revisión' })
  @ApiResponse({ status: 400, description: 'Entrada inválida o archivos corruptos' })
  async submitKyc(@Body() body: KycSubmitDto) {
    const { userId, ciFrontBase64, ciBackBase64, selfieBase64 } = body;
    const bucket = 'kyc-docs';

    const uploadBase64 = async (base64String: string, fileName: string) => {
      // Extract file type and clean base64 data
      const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
      let contentType = 'image/jpeg';
      let buffer: Buffer;

      if (matches) {
        contentType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        // Fallback if raw base64 is passed without metadata prefix
        buffer = Buffer.from(base64String, 'base64');
      }

      const { data, error } = await supabase.storage.from(bucket).upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        throw new BadRequestException(`Error al subir ${fileName}: ${error.message}`);
      }

      return data?.fullPath;
    };

    try {
      const ciFrontPath = await uploadBase64(ciFrontBase64, `${userId}/ci_front_${Date.now()}.jpg`);
      const ciBackPath = await uploadBase64(ciBackBase64, `${userId}/ci_back_${Date.now()}.jpg`);
      const selfiePath = await uploadBase64(selfieBase64, `${userId}/selfie_${Date.now()}.jpg`);

      await this.kycService.processKyc(userId, { ciFrontPath, ciBackPath, selfiePath });
      return { message: 'KYC enviado y en revisión' };
    } catch (err) {
      throw new BadRequestException(err.message || 'Error procesando la solicitud KYC');
    }
  }
}

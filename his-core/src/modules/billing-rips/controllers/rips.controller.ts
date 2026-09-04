import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  RipsService,
  EncolarRipsResponse,
  RipsLoteDetalleResponse,
} from '../services/rips.service';
import { GenerateRipsDto } from '../dto/generate-rips.dto';
import { TenantContextService } from '../../../core/tenancy/services/tenant-context.service';

@Controller('rips')
export class RipsController {
  constructor(
    private readonly ripsService: RipsService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post('generar')
  @HttpCode(HttpStatus.ACCEPTED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async encolarGeneracionRips(
    @Body() dto: GenerateRipsDto,
  ): Promise<EncolarRipsResponse> {
    const tenantId = this.tenantContextService.getRequiredTenantId();
    return this.ripsService.encolarGeneracionRips(tenantId, dto);
  }

  @Get('lotes/:id/estado')
  @HttpCode(HttpStatus.OK)
  async consultarEstadoLote(
    @Param('id', new ParseUUIDPipe({ version: '4' })) loteId: string,
  ): Promise<RipsLoteDetalleResponse> {
    const tenantId = this.tenantContextService.getRequiredTenantId();
    return this.ripsService.consultarEstadoLote(tenantId, loteId);
  }
}

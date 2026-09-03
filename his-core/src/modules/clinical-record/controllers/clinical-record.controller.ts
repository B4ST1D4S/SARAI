import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  Ip,
} from '@nestjs/common';
import { ClinicalRecordService, FolioCreationResult } from '../services/clinical-record.service';
import {
  ClinicalPdfService,
  ClinicalPdfStatusResponse,
} from '../services/clinical-pdf.service';
import { TenantContextService } from '../../../core/tenancy/services/tenant-context.service';
import { CreateFolioConsultaExternaDto } from '../dto/create-folio-consulta-externa.dto';

@Controller('clinical-records')
export class ClinicalRecordController {
  constructor(
    private readonly clinicalRecordService: ClinicalRecordService,
    private readonly clinicalPdfService: ClinicalPdfService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Post('folios/consulta-externa')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async crearFolioConsultaExterna(
    @Body() body: CreateFolioConsultaExternaDto,
    @Ip() ip: string,
  ): Promise<FolioCreationResult> {
    body.ipRegistro = ip || '127.0.0.1';
    return this.clinicalRecordService.crearFolioConsultaExterna(body);
  }

  @Get('folios/:id/pdf')
  @HttpCode(HttpStatus.OK)
  async obtenerPdfFolio(
    @Param('id', new ParseUUIDPipe({ version: '4' })) folioId: string,
  ): Promise<ClinicalPdfStatusResponse> {
    const tenantId = this.tenantContextService.getRequiredTenantId();
    return this.clinicalPdfService.obtenerOEncolarPdfFolio(tenantId, folioId);
  }
}
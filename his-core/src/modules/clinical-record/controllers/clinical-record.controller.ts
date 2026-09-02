import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Ip,
} from '@nestjs/common';
import { ClinicalRecordService, FolioCreationResult } from '../services/clinical-record.service';
import { CreateFolioConsultaExternaDto } from '../dto/create-folio-consulta-externa.dto';

@Controller('clinical-records')
export class ClinicalRecordController {
  constructor(private readonly clinicalRecordService: ClinicalRecordService) {}

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
}
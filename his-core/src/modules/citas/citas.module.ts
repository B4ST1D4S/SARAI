import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { FacturacionModule } from '../facturacion/facturacion.module';

@Module({
  imports: [FacturacionModule],
  controllers: [CitasController],
  providers: [CitasService],
  exports: [CitasService],
})
export class CitasModule {}

import { Module } from '@nestjs/common';
import { TiposConsultaController } from './tipos-consulta.controller';
import { TiposConsultaService } from './tipos-consulta.service';

@Module({
  controllers: [TiposConsultaController],
  providers: [TiposConsultaService],
  exports: [TiposConsultaService],
})
export class TiposConsultaModule {}

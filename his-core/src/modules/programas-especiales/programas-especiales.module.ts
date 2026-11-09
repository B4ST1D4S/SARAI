import { Module } from '@nestjs/common';
import { ProgramasEspecialesController } from './programas-especiales.controller';
import { ProgramasEspecialesService } from './programas-especiales.service';

@Module({
  controllers: [ProgramasEspecialesController],
  providers: [ProgramasEspecialesService],
  exports: [ProgramasEspecialesService],
})
export class ProgramasEspecialesModule {}

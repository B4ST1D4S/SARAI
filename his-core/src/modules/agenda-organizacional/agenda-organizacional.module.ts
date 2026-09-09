import { Module } from '@nestjs/common';
import { AgendaOrganizacionalController } from './agenda-organizacional.controller';
import { AgendaOrganizacionalService } from './agenda-organizacional.service';

@Module({
  controllers: [AgendaOrganizacionalController],
  providers: [AgendaOrganizacionalService],
  exports: [AgendaOrganizacionalService],
})
export class AgendaOrganizacionalModule {}

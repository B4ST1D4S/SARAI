import { Module, Global } from '@nestjs/common';
import { SpacesStorageService } from './services/spaces-storage.service';

@Global()
@Module({
  providers: [SpacesStorageService],
  exports: [SpacesStorageService],
})
export class StorageModule {}

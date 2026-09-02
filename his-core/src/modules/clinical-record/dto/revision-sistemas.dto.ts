import { IsOptional, IsString } from 'class-validator';

export class RevisionSistemasDto {
  @IsOptional()
  @IsString()
  general?: string;

  @IsOptional()
  @IsString()
  cardiovascular?: string;

  @IsOptional()
  @IsString()
  respiratorio?: string;

  @IsOptional()
  @IsString()
  gastrointestinal?: string;

  @IsOptional()
  @IsString()
  genitourinario?: string;

  @IsOptional()
  @IsString()
  neurologico?: string;

  @IsOptional()
  @IsString()
  dermatologico?: string;

  @IsOptional()
  @IsString()
  musculoesqueletico?: string;

  @IsOptional()
  @IsString()
  endocrino?: string;

  @IsOptional()
  @IsString()
  organosSentidos?: string;

  @IsOptional()
  @IsString()
  psiquiatrico?: string;

  @IsOptional()
  @IsString()
  linfatico?: string;
}
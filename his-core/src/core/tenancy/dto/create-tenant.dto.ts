import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsEmail,
  Matches,
  IsObject,
  IsNumber,
} from 'class-validator';
import {
  TenantPlan,
  TenantStatus,
  ClinicalSettings,
} from '../entities/tenant.entity';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message:
      'El subdominio solo puede contener letras minúsculas, números y guiones',
  })
  subdomain: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan;

  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;

  @IsString()
  @IsNotEmpty()
  dbName: string;

  @IsOptional()
  @IsString()
  dbHost?: string;

  @IsOptional()
  @IsNumber()
  dbPort?: number;

  @IsOptional()
  @IsString()
  dbUser?: string;

  @IsOptional()
  @IsString()
  dbPassword?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  clinicalSettings?: ClinicalSettings;
}

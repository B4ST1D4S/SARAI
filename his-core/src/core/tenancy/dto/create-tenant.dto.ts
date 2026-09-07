import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsEmail,
  Matches,
  IsObject,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import {
  TenantPlan,
  TenantStatus,
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

  @IsOptional()
  @IsString()
  nitIps?: string;

  @IsOptional()
  @IsString()
  code?: string; // Alias retrocompatible para nitIps

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(TenantPlan)
  planTier?: TenantPlan;

  @IsOptional()
  @IsEnum(TenantPlan)
  plan?: TenantPlan; // Alias retrocompatible para planTier

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
  dbPasswordEncrypted?: string;

  @IsOptional()
  @IsString()
  dbPassword?: string; // Alias para contraseña en texto plano antes de cifrar

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  clinicalSettings?: Record<string, any>;
}

import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  subdomain!: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}
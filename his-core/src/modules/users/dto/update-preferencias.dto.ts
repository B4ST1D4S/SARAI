import { IsIn, IsOptional, IsString } from 'class-validator';

export type NavModeType = 'hub' | 'sidebar';

export class UpdatePreferenciasDto {
  @IsOptional()
  @IsString({ message: 'El modo de navegación debe ser una cadena de texto' })
  @IsIn(['hub', 'sidebar'], {
    message: 'El modo de navegación debe ser "hub" o "sidebar"',
  })
  navMode?: NavModeType;

  @IsOptional()
  @IsString({ message: 'El tema visual debe ser una cadena de texto' })
  theme?: string;
}

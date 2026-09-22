import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  nombreCompleto: string;
  rol: string;
  tenantId: string;
  tenantSubdomain: string;
  profesionalId: string | null;
  registroMedico: string | null;
  especialidad: string | null;
  esAsistencial: boolean;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.tenantId) {
      throw new UnauthorizedException('Token de acceso malformado o inválido');
    }
    return payload;
  }
}

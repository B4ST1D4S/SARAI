import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly REFRESH_COOKIE_NAME = '__Host-refresh_token';

  constructor(private readonly authService: AuthService) {}

  /**
   * Helper para inyectar la cookie HttpOnly segura con estándar NIST / ISO 27001
   */
  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie(this.REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      // El prefijo __Host- exige Secure siempre, incluso en local
      // (localhost es tratado como contexto seguro por los navegadores modernos).
      secure: true,
      sameSite: 'strict',        // Mitiga ataques CSRF
      // El prefijo __Host- exige Path=/ exacto (junto con Secure y sin Domain);
      // con cualquier otro path el navegador descarta la cookie silenciosamente.
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });
  }

  /**
   * Helper para limpiar la cookie en logout
   */
  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie(this.REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/', // Mismo path que al setearla, si no el navegador no la reconoce
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(loginDto, ipAddress, userAgent);

    // Inyectar el Refresh Token en cookie HttpOnly
    this.setRefreshTokenCookie(res, result.refreshToken);

    // El access token y datos mínimos viajan en el cuerpo JSON
    return {
      accessToken: result.accessToken,
      usuario: result.usuario,
      institucion: result.institucion,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // 1. Obtener el Refresh Token preferentemente de la cookie HttpOnly
    const rawToken = req.cookies?.[this.REFRESH_COOKIE_NAME] || dto.refreshToken;

    if (!rawToken) {
      throw new UnauthorizedException('Token de actualización no proporcionado');
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const tokens = await this.authService.refreshTokens(
      dto,
      rawToken,
      ipAddress,
      userAgent,
    );

    // Rotar la cookie con el nuevo Refresh Token
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('subdomain') subdomain: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[this.REFRESH_COOKIE_NAME];
    if (rawToken && subdomain) {
      await this.authService.logout(subdomain, rawToken);
    }

    this.clearRefreshTokenCookie(res);
    return { mensaje: 'Sesión cerrada exitosamente' };
  }

  /**
   * Endpoint de prueba para verificar que el access token funciona con el Guard
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return req.user;
  }
}
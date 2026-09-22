import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './services/auth.service';
import { PasswordHasherService } from './services/password-hasher.service';
import { TokenVaultService } from './services/token-vault.service';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TenancyModule } from '../../core/tenancy/tenancy.module';

@Module({
  imports: [
    TenancyModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasherService, TokenVaultService, JwtStrategy],
  exports: [AuthService, PasswordHasherService, TokenVaultService, JwtModule, PassportModule],
})
export class AuthModule {}
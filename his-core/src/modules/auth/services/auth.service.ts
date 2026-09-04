import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TenancyService } from '../../../core/tenancy/services/tenancy-context.service';
import { TenancyConnectionService } from '../../../core/tenancy/services/tenancy-connection.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tenancyService: TenancyService,
    private readonly tenancyConnectionService: TenancyConnectionService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { identifier, password, subdomain } = loginDto;

    // 1. Resolver el Tenant desde his_master
    const tenant = await this.tenancyService.getTenantBySubdomain(subdomain.toLowerCase().trim());
    if (!tenant || !tenant.active) {
      throw new NotFoundException(`La institución '${subdomain}' no existe o se encuentra inactiva`);
    }

    // 2. Obtener la conexión a la base de datos de esa clínica específica
    const tenantPool = await this.tenancyConnectionService.getTenantPool(tenant);

    // 3. Buscar el usuario en la BD de la clínica (con LEFT JOIN a profesionales_salud)
    const query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.password_hash,
        u.primer_nombre,
        u.primer_apellido,
        u.rol,
        u.activo,
        p.id AS profesional_id,
        p.registro_medico,
        p.especialidad_principal
      FROM usuarios u
      LEFT JOIN profesionales_salud p ON p.usuario_id = u.id
      WHERE (LOWER(u.username) = LOWER($1) OR LOWER(u.email) = LOWER($1))
      LIMIT 1;
    `;

    const result = await tenantPool.query(query, [identifier.trim()]);
    const user = result.rows[0];

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.activo) {
      throw new UnauthorizedException('El usuario se encuentra inactivo. Contacte al administrador.');
    }

    // 4. Validar contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 5. Construir Payload del JWT
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      nombreCompleto: `${user.primer_nombre} ${user.primer_apellido}`,
      rol: user.rol,
      tenantId: tenant.id,
      tenantSubdomain: tenant.subdomain,
      profesionalId: user.profesional_id || null,
      registroMedico: user.registro_medico || null,
      especialidad: user.especialidad_principal || null,
      esAsistencial: !!user.profesional_id,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Usuario [${user.username}] autenticado exitosamente en tenant [${tenant.subdomain}]`);

    return {
      access_token: accessToken,
      usuario: {
        id: user.id,
        username: user.username,
        email: user.email,
        nombre: `${user.primer_nombre} ${user.primer_apellido}`,
        rol: user.rol,
        esAsistencial: !!user.profesional_id,
        especialidad: user.especialidad_principal || null,
      },
      institucion: {
        id: tenant.id,
        subdominio: tenant.subdomain,
        nombre: tenant.name || tenant.subdomain,
      },
    };
  }
}
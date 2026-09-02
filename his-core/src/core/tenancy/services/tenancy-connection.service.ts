import {
  Injectable,
  Logger,
  OnModuleDestroy,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { TenantContextService } from './tenant-context.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenancyConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenancyConnectionService.name);
  private readonly tenantPools = new Map<string, Pool>();

  constructor(
    private readonly tenantContextService: TenantContextService,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  /**
   * Obtiene o crea el pool de conexiones de PostgreSQL aislado para el tenant activo en el contexto
   */
  public getTenantPool(): Pool {
    const tenantContext = this.tenantContextService.getContext();
    if (!tenantContext) {
      throw new InternalServerErrorException(
        'No se encontró un TenantContext activo para resolver la conexión a la base de datos.',
      );
    }

    const { tenantId, dbConfig } = tenantContext;
    const cacheKey = tenantId;

    let pool = this.tenantPools.get(cacheKey);
    if (!pool) {
      const defaultHost =
        this.configService?.get<string>('masterDb.host') ??
        process.env.MASTER_DB_HOST ??
        'localhost';
      const defaultUser =
        this.configService?.get<string>('masterDb.user') ??
        process.env.MASTER_DB_USER ??
        'postgres';
      const defaultPassword =
        this.configService?.get<string>('masterDb.password') ??
        process.env.MASTER_DB_PASSWORD ??
        'postgres';
      const defaultPort =
        this.configService?.get<number>('masterDb.port') ??
        parseInt(process.env.MASTER_DB_PORT ?? '5432', 10);

      pool = new Pool({
        host: dbConfig.host || defaultHost,
        port: dbConfig.port || defaultPort,
        database: dbConfig.database,
        user: dbConfig.username || defaultUser,
        password: dbConfig.password || defaultPassword,
        max: 15,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      pool.on('error', (err) => {
        this.logger.error(
          `Error inesperado en el pool del tenant [${tenantId}] (${dbConfig.database}):`,
          err,
        );
      });

      this.tenantPools.set(cacheKey, pool);
      this.logger.log(
        `Pool de PostgreSQL inicializado para tenant '${tenantContext.subdomain}' [DB: ${dbConfig.database}]`,
      );
    }

    return pool;
  }

  /**
   * Ejecuta un bloque de operaciones dentro de una transacción PostgreSQL (BEGIN / COMMIT / ROLLBACK)
   * sobre la base de datos del tenant actual.
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const pool = this.getTenantPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        this.logger.error(
          'Fallo al realizar ROLLBACK en la transacción del tenant:',
          rollbackError,
        );
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Ejecuta una consulta directa sobre la base de datos del tenant actual
   */
  async query<T extends QueryResultRow = any>(
    queryText: string,
    params?: any[],
  ): Promise<QueryResult<T>> {
    const pool = this.getTenantPool();
    return pool.query<T>(queryText, params);
  }

  /**
   * Cierra todos los pools de conexión al destruirse el módulo
   */
  async onModuleDestroy(): Promise<void> {
    for (const [tenantId, pool] of this.tenantPools.entries()) {
      try {
        await pool.end();
        this.logger.log(`Pool cerrado para tenant: ${tenantId}`);
      } catch (err) {
        this.logger.error(
          `Error al cerrar el pool para tenant: ${tenantId}`,
          err,
        );
      }
    }
    this.tenantPools.clear();
  }
}

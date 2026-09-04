import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PROVISIONING = 'PROVISIONING',
}

export enum TenantPlan {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  HOSPITAL_ENTERPRISE = 'HOSPITAL_ENTERPRISE',
}

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, name: 'nombre', default: '' })
  name!: string;

  get nombre(): string {
    return this.name;
  }

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 63, unique: true, name: 'subdominio' })
  subdomain!: string;

  get subdominio(): string {
    return this.subdomain;
  }

  // Mapeo a la columna real 'nit' existente en tu BD
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, name: 'nit', nullable: true })
  nit?: string;

  get nitIps(): string | undefined {
    return this.nit;
  }

  // Alias para servicios que piden tenant.code
  get code(): string {
    return this.nit || this.subdomain || this.id;
  }

  @Column({
    type: 'varchar',
    length: 20,
    name: 'estado',
    default: TenantStatus.ACTIVE,
  })
  status!: TenantStatus;

  get estado(): string {
    return this.status;
  }

  get isActive(): boolean {
    return this.status === TenantStatus.ACTIVE;
  }

  set isActive(active: boolean) {
    this.status = active ? TenantStatus.ACTIVE : TenantStatus.INACTIVE;
  }

  // Conexión a la BD dedicada del Tenant (Supabase clinica_demo)
  @Column({ type: 'varchar', length: 100, name: 'db_host', nullable: true })
  dbHost!: string;

  get db_host(): string {
    return this.dbHost;
  }

  @Column({ type: 'int', name: 'db_port', default: 5432 })
  dbPort!: number;

  get db_port(): number {
    return this.dbPort;
  }

  @Column({ type: 'varchar', length: 100, name: 'db_name', default: 'postgres' })
  dbName!: string;

  get db_name(): string {
    return this.dbName;
  }

  @Column({ type: 'varchar', length: 100, name: 'db_user', nullable: true })
  dbUser!: string;

  get db_user(): string {
    return this.dbUser;
  }

  @Column({
    type: 'varchar',
    length: 255,
    name: 'db_password',
    nullable: true,
  })
  dbPassword?: string;

  get db_password(): string | undefined {
    return this.dbPassword;
  }

  get dbPasswordEncrypted(): string | undefined {
    return this.dbPassword;
  }

  set dbPasswordEncrypted(val: string | undefined) {
    this.dbPassword = val;
  }

  @Column({ type: 'boolean', name: 'db_ssl', default: true })
  dbSsl!: boolean;

  get db_ssl(): boolean {
    return this.dbSsl;
  }

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt?: Date;

  // Propiedades virtuales para evitar errores en servicios sin persistirlas en BD
  planTier?: TenantPlan;
  clinicalSettings?: Record<string, any>;
  contactEmail?: string;
  contactPhone?: string;
}
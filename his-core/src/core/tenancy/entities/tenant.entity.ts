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

export interface ClinicalSettings {
  enableOdontology?: boolean;
  enableHospitalization?: boolean;
  enableEmergencyRoom?: boolean;
  enableElectronicPrescription?: boolean;
  enableVoiceAiDictation?: boolean;
  maxActiveUsers?: number;
  timezone?: string;
  currency?: string;
}

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 63, unique: true })
  subdomain: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string; // Código de habilitación REPS o NIT institucional

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({
    type: 'enum',
    enum: TenantPlan,
    default: TenantPlan.PROFESSIONAL,
  })
  plan: TenantPlan;

  // Credenciales de la Base de Datos dedicada para este Tenant
  @Column({ type: 'varchar', length: 100, name: 'db_name' })
  dbName: string;

  @Column({ type: 'varchar', length: 100, name: 'db_host', nullable: true })
  dbHost?: string;

  @Column({ type: 'int', name: 'db_port', default: 5432 })
  dbPort: number;

  @Column({ type: 'varchar', length: 100, name: 'db_user', nullable: true })
  dbUser?: string;

  @Column({
    type: 'varchar',
    length: 255,
    name: 'db_password',
    nullable: true,
    select: false,
  })
  dbPassword?: string;

  @Column({ type: 'varchar', length: 150, name: 'contact_email', nullable: true })
  contactEmail?: string;

  @Column({ type: 'varchar', length: 50, name: 'contact_phone', nullable: true })
  contactPhone?: string;

  // Configuración de módulos clínicos habilitados
  @Column({ type: 'jsonb', name: 'clinical_settings', default: {} })
  clinicalSettings: ClinicalSettings;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

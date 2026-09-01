export interface ResultadoValidacionRips {
    clase: 'RECHAZADO' | 'NOTIFICACION';
    codigo: string;
    descripcion: string;
    observaciones: string;
    pathFuente: string;
    fuente: 'Paciente' | 'CuentaItem' | 'Contrato';
}
export interface ReporteValidacionRips {
    cuentaId: string;
    totalErrores: number;
    totalNotificaciones: number;
    puedeFacturar: boolean;
    resultados: ResultadoValidacionRips[];
}
export declare function clasificarTipoRips(codigo?: string | null): string;
export declare const COMPONENTE_LABEL: Record<string, string>;
export declare function validarRipsCuenta(cuentaId: string): Promise<ReporteValidacionRips>;

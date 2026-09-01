import axios from 'axios';
import https from 'https';
// Configuración separada por ambiente: cada uno apunta a su propio contenedor
// FEV-RIPS Docker y puede tener certificado/host distintos.
function getConfig(ambiente) {
    if (ambiente === 'PRODUCCION') {
        return {
            baseURL: process.env.FEVRIPS_PRODUCCION_BASE_URL || 'https://localhost:9443',
            // El certificado de producción real debe ser válido; solo se relaja si se
            // configura explícitamente (ej. mientras se usa el .pfx autofirmado local).
            rejectUnauthorized: process.env.FEVRIPS_PRODUCCION_TLS_REJECT_UNAUTHORIZED !== 'false',
        };
    }
    return {
        baseURL: process.env.FEVRIPS_STAGE_BASE_URL || 'https://localhost:9443',
        rejectUnauthorized: process.env.FEVRIPS_STAGE_TLS_REJECT_UNAUTHORIZED === 'true',
    };
}
function getClient(ambiente) {
    const { baseURL, rejectUnauthorized } = getConfig(ambiente);
    return axios.create({
        baseURL,
        httpsAgent: new https.Agent({ rejectUnauthorized }),
        timeout: 30000,
        validateStatus: () => true, // manejamos el status nosotros mismos (MSPS responde 200 aun con login:false)
    });
}
export async function loginSispro(ambiente, usuario) {
    const client = getClient(ambiente);
    const body = {
        persona: { identificacion: { tipo: usuario.tipoIdentificacion, numero: usuario.numeroIdentificacion } },
        clave: usuario.clave,
        nit: usuario.nit,
    };
    if (usuario.tipoUsuario)
        body.tipoUsuario = usuario.tipoUsuario;
    const { data } = await client.post('/api/Auth/LoginSISPRO', body);
    return data;
}
// Mapeo módulo (RipsPrueba.modulo) -> endpoint FEV-RIPS, según el manual de consumo v4.3
const MODULO_ENDPOINT = {
    FacturaElectronica: '/api/PaquetesFevRips/CargarFevRips',
    NotaCredito: '/api/PaquetesFevRips/CargarNC',
    NotaCreditoTotal: '/api/PaquetesFevRips/CargarNCTotal',
    NotaDebito: '/api/PaquetesFevRips/CargarND',
    NotaAjuste: '/api/PaquetesFevRips/CargarNotaAjuste',
    RipsSinFactura: '/api/PaquetesFevRips/CargarRipsSinFactura',
    CapitaInicial: '/api/PaquetesFevRips/CargarCapitaInicial',
    CapitaPeriodo: '/api/PaquetesFevRips/CargarCapitaPeriodo',
    CapitaFinal: '/api/PaquetesFevRips/CargarCapitaFinal',
    NCAcuerdoVoluntades: '/api/PaquetesFevRips/CargarNCAcuerdoVoluntades',
    NCCapita: '/api/PaquetesFevRips/CargarNCCapita',
};
export function moduloSoportado(modulo) {
    return modulo in MODULO_ENDPOINT;
}
export async function cargarPaquete(ambiente, token, modulo, ripsJson, xmlFevFile) {
    const endpoint = MODULO_ENDPOINT[modulo];
    if (!endpoint)
        throw new Error(`Módulo FEV-RIPS no soportado: ${modulo}`);
    const client = getClient(ambiente);
    const { data } = await client.post(endpoint, { rips: ripsJson, xmlFevFile: xmlFevFile ?? '' }, { headers: { Authorization: `Bearer ${token}` } });
    return data;
}
export async function consultarCuv(ambiente, codigoUnicoValidacion) {
    const client = getClient(ambiente);
    const { data } = await client.post('/api/ConsultasFevRips/ConsultarCUV', { codigoUnicoValidacion });
    return data;
}
export async function recuperarCuv(ambiente, token, codigoUnicoValidacion) {
    const client = getClient(ambiente);
    const { data } = await client.post('/api/PaquetesFevRips/RecuperarCUV', { codigoUnicoValidacion }, { headers: { Authorization: `Bearer ${token}` } });
    return data;
}

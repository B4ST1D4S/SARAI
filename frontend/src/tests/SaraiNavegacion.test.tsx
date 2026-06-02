/**
 * Tests SARAI — Navegación por voz y secciones HC
 *
 * Cubre:
 *  1. normalizarTexto: quita tildes y convierte a minúsculas
 *  2. MATCH_ACTIVACION_SARAI: detecta wake word con variantes fonéticas
 *  3. COMANDOS_NAV: todas las páginas del sistema tienen al menos una palabra clave
 *  4. SECCIONES_HC_VOZ: las 15 secciones HC tienen al menos una palabra clave
 *  5. Extracción de comando después del wake word
 *  6. Resolución correcta de página por comando de voz
 *  7. Resolución correcta de sección HC por comando de voz
 */
import { describe, it, expect } from 'vitest';

// ─── Re-exportamos internals para test (copiamos la lógica, no importamos el componente)
// Esto evita cargar React y canvas APIs en el entorno Node.

function normalizarTexto(texto: string) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

const MATCH_ACTIVACION_SARAI = /^sara[a-z]{0,4}\b\s*|^(hey|oye|hola)\s+sara[a-z]{0,4}\b\s*/;

const COMANDOS_NAV = [
  { palabras: ['dashboard', 'inicio', 'panel principal', 'panel'],                                             pagina: 'dashboard' },
  { palabras: ['pacientes', 'lista pacientes', 'lista de pacientes'],                                          pagina: 'pacientes' },
  { palabras: ['historia clínica', 'historia clinica', 'historial', 'historia'],                              pagina: 'historia' },
  { palabras: ['agenda profesional', 'agenda del médico', 'agenda del medico', 'agenda medico'],              pagina: 'agendaProfesional' },
  { palabras: ['configurar agenda', 'config agenda', 'configuracion agenda', 'configuración agenda'],         pagina: 'config-agenda' },
  { palabras: ['agenda paciente', 'agenda del paciente', 'agenda', 'citas'],                                  pagina: 'agenda' },
  { palabras: ['admisión', 'admision', 'admitir'],                                                            pagina: 'admision' },
  { palabras: ['quirófano', 'quirofano', 'cirujano', 'vista cirujano', 'sala de cirugía', 'sala cirugia'],   pagina: 'vista-cirujano' },
  { palabras: ['seguimiento', 'follow up', 'followup', 'control'],                                            pagina: 'followup' },
  { palabras: ['consentimiento', 'consentimientos', 'consentimiento informado'],                              pagina: 'consentimiento' },
  { palabras: ['crm', 'gestión de relaciones', 'gestion de relaciones'],                                     pagina: 'crm' },
  { palabras: ['facturación', 'facturacion', 'facturas', 'factura'],                                         pagina: 'facturacion' },
  { palabras: ['plantillas', 'plantilla'],                                                                    pagina: 'plantillas' },
  { palabras: ['fotos', 'fotografías', 'fotografias', 'galería', 'galeria'],                                 pagina: 'fotos' },
  { palabras: ['mapa corporal', 'mapa del cuerpo', 'mapa'],                                                   pagina: 'mapa-corporal' },
  { palabras: ['admin', 'administración', 'administracion', 'parametrización', 'parametrizacion', 'sistema'], pagina: 'admin' },
];

const SECCIONES_HC_VOZ: { palabras: string[]; id: string }[] = [
  { palabras: ['motivo de consulta', 'motivo', 'queja principal', 'queja'],                            id: 'motivo-consulta' },
  { palabras: ['signos vitales', 'signos', 'vitales', 'presion arterial', 'frecuencia cardiaca'],      id: 'signos-vitales'  },
  { palabras: ['antecedentes personales'],                                                              id: 'antec-pers'      },
  { palabras: ['antecedentes familiares', 'familiares', 'familia'],                                    id: 'antec-fam'       },
  { palabras: ['gineco', 'ginecologico', 'ginecoobstetrico', 'obstetricia', 'fum', 'menstruacion'],    id: 'antec-gineco'    },
  { palabras: ['evolucion cirugia', 'evolucion cirugia plastica', 'evolucion estetica', 'postoperatorio', 'postop'], id: 'evolucion-cx' },
  { palabras: ['finalidad de atencion', 'finalidad'],                                                  id: 'finalidad'       },
  { palabras: ['origen de atencion', 'origen'],                                                        id: 'origen'          },
  { palabras: ['diagnostico', 'impresion diagnostica', 'cie diez', 'cie10', 'diagnostico principal'],  id: 'diagnostico'     },
  { palabras: ['plan terapeutico', 'plan', 'conducta', 'tratamiento', 'manejo'],                       id: 'plan'            },
  { palabras: ['recomendaciones', 'recomendacion', 'indicaciones'],                                    id: 'recomendaciones' },
  { palabras: ['apoyos diagnosticos', 'laboratorio', 'laboratorios', 'examenes', 'imagen diagnostica'], id: 'apoyos-diag'   },
  { palabras: ['procedimientos quirurgicos', 'procedimiento quirurgico', 'procedimiento qx'],          id: 'proc-qx'         },
  { palabras: ['medicamentos', 'formulacion', 'medicamento', 'medicina', 'farmaco'],                   id: 'medicamentos'    },
  { palabras: ['interconsulta', 'interconsultas', 'especialista', 'especialidad'],                     id: 'interconsulta'   },
];

const PREFIJOS_NAV = ['ir a ', 'abrir ', 'navegar a ', 'mostrar ', 've a ', 'abre ', 'llevar a ', 'ir '];

function resolverPagina(cmd: string): string | null {
  let navCmd = cmd;
  for (const p of PREFIJOS_NAV) {
    if (cmd.startsWith(p)) { navCmd = cmd.slice(p.length).trim(); break; }
  }
  for (const nav of COMANDOS_NAV) {
    if (nav.palabras.some(p => {
      const pn = normalizarTexto(p);
      return navCmd === pn || navCmd.startsWith(pn + ' ') || navCmd.endsWith(' ' + pn) || navCmd.includes(' ' + pn + ' ') || navCmd.includes(pn);
    })) return nav.pagina;
  }
  return null;
}

function resolverSeccionHC(cmd: string): string | null {
  for (const sec of SECCIONES_HC_VOZ) {
    if (sec.palabras.some(p => cmd.includes(normalizarTexto(p)))) return sec.id;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
describe('normalizarTexto', () => {
  it('quita tildes', () => {
    expect(normalizarTexto('Histórico')).toBe('historico');
  });
  it('pasa a minúsculas', () => {
    expect(normalizarTexto('SARAI')).toBe('sarai');
  });
  it('elimina ñ → n no, pero sí tildes de vocales', () => {
    expect(normalizarTexto('quirófano')).toBe('quirofano');
  });
});

describe('MATCH_ACTIVACION_SARAI — wake word', () => {
  const casos = [
    ['sarai ir a dashboard', true],
    ['sara ir a pacientes',  true],
    ['saray diagnóstico',    true],
    ['sarah medicamentos',   true],
    ['hey sarai agenda',     true],
    ['oye sara historia',    true],
    ['ir a dashboard',       false],  // sin wake word → debe ser falso
    ['historia clinica',     false],
  ] as const;

  casos.forEach(([texto, esperado]) => {
    it(`"${texto}" → activado: ${esperado}`, () => {
      expect(MATCH_ACTIVACION_SARAI.test(normalizarTexto(texto))).toBe(esperado);
    });
  });
});

describe('COMANDOS_NAV — todas las páginas tienen palabras clave', () => {
  const paginasEsperadas = [
    'dashboard', 'pacientes', 'historia', 'agendaProfesional',
    'config-agenda', 'agenda', 'admision', 'vista-cirujano',
    'followup', 'consentimiento', 'crm', 'facturacion',
    'plantillas', 'fotos', 'mapa-corporal', 'admin',
  ];
  paginasEsperadas.forEach(pagina => {
    it(`"${pagina}" tiene al menos una palabra clave`, () => {
      const entry = COMANDOS_NAV.find(n => n.pagina === pagina);
      expect(entry).toBeDefined();
      expect(entry!.palabras.length).toBeGreaterThan(0);
    });
  });
});

describe('SECCIONES_HC_VOZ — las 15 secciones tienen palabras clave', () => {
  const idsEsperados = [
    'motivo-consulta', 'signos-vitales', 'antec-pers', 'antec-fam',
    'antec-gineco', 'evolucion-cx', 'finalidad', 'origen',
    'diagnostico', 'plan', 'recomendaciones',
    'apoyos-diag', 'proc-qx', 'medicamentos', 'interconsulta',
  ];
  idsEsperados.forEach(id => {
    it(`sección "${id}" tiene al menos una palabra clave`, () => {
      const entry = SECCIONES_HC_VOZ.find(s => s.id === id);
      expect(entry).toBeDefined();
      expect(entry!.palabras.length).toBeGreaterThan(0);
    });
  });
});

describe('resolverPagina — navegación por voz', () => {
  const casos: [string, string][] = [
    ['sarai ir a dashboard',        'dashboard'],
    ['sarai abrir pacientes',       'pacientes'],
    ['sarai historia clinica',      'historia'],
    ['sarai agenda profesional',    'agendaProfesional'],
    ['sarai config agenda',         'config-agenda'],
    ['sarai agenda',                'agenda'],
    ['sarai admision',              'admision'],
    ['sarai quirofano',             'vista-cirujano'],
    ['sarai seguimiento',           'followup'],
    ['sarai consentimiento',        'consentimiento'],
    ['sarai crm',                   'crm'],
    ['sarai facturacion',           'facturacion'],
    ['sarai plantillas',            'plantillas'],
    ['sarai fotos',                 'fotos'],
    ['sarai mapa corporal',         'mapa-corporal'],
    ['sarai parametrizacion',       'admin'],
  ];
  casos.forEach(([texto, paginaEsperada]) => {
    it(`"${texto}" → "${paginaEsperada}"`, () => {
      const t = normalizarTexto(texto);
      const cmd = t.replace(MATCH_ACTIVACION_SARAI, '').trim();
      expect(resolverPagina(cmd)).toBe(paginaEsperada);
    });
  });
});

describe('resolverSeccionHC — secciones historia clínica por voz', () => {
  const casos: [string, string][] = [
    ['sarai motivo de consulta',         'motivo-consulta'],
    ['sarai signos vitales',             'signos-vitales'],
    ['sarai antecedentes personales',    'antec-pers'],
    ['sarai antecedentes familiares',    'antec-fam'],
    ['sarai gineco',                     'antec-gineco'],
    ['sarai evolucion cirugia',          'evolucion-cx'],
    ['sarai finalidad',                  'finalidad'],
    ['sarai origen',                     'origen'],
    ['sarai diagnostico',                'diagnostico'],
    ['sarai plan terapeutico',           'plan'],
    ['sarai recomendaciones',            'recomendaciones'],
    ['sarai laboratorio',                'apoyos-diag'],
    ['sarai procedimientos quirurgicos', 'proc-qx'],
    ['sarai medicamentos',               'medicamentos'],
    ['sarai interconsulta',              'interconsulta'],
  ];
  casos.forEach(([texto, idEsperado]) => {
    it(`"${texto}" → sección "${idEsperado}"`, () => {
      const t = normalizarTexto(texto);
      const cmd = t.replace(MATCH_ACTIVACION_SARAI, '').trim();
      expect(resolverSeccionHC(cmd)).toBe(idEsperado);
    });
  });
});

describe('comando imprimir', () => {
  it('detecta "sarai imprimir"', () => {
    const t = normalizarTexto('sarai imprimir');
    const cmd = t.replace(MATCH_ACTIVACION_SARAI, '').trim();
    expect(cmd.includes('imprimir')).toBe(true);
  });
  it('detecta "sarai imprimir historia"', () => {
    const t = normalizarTexto('sarai imprimir historia');
    const cmd = t.replace(MATCH_ACTIVACION_SARAI, '').trim();
    expect(cmd.includes('imprimir')).toBe(true);
  });
});

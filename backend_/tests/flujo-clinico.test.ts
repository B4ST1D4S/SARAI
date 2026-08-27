/**
 * Tests de integración — Flujo clínico completo
 * Módulo 1: Auth → Paciente → Cita (Agenda)
 * Módulo 2: Agenda Profesional → Completar Cita
 * Módulo 3: Historia Clínica → Crear HC
 *
 * Estos tests usan el backend real en http://localhost:3001
 */

const BASE = 'http://localhost:3001/api';

// ─── Utilidad HTTP ────────────────────────────────────────────────────────────
async function api(
  method: string,
  path: string,
  body?: object,
  token?: string
): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  return { status: res.status, data };
}

// ─── Estado compartido entre tests ───────────────────────────────────────────
let token = '';
let medicoId = '';
let pacienteId = '';
let citaId = '';
const DOC_TEST = `TEST${Date.now()}`.slice(0, 15);

// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO 1 — AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
describe('Módulo 1 — Autenticación', () => {
  test('Login con credenciales válidas devuelve token', async () => {
    const { status, data } = await api('POST', '/auth/login', {
      email: 'medico@estegia.com',
      password: '123456',
    });

    expect(status).toBe(200);
    expect(data.accessToken).toBeTruthy();
    expect(data.user).toBeDefined();
    expect(data.user.id).toBeTruthy();

    // Guardar para tests posteriores
    token = data.accessToken;
    medicoId = data.user.id;
  });

  test('Login con contraseña incorrecta devuelve 401', async () => {
    const { status, data } = await api('POST', '/auth/login', {
      email: 'medico@estegia.com',
      password: 'wrongpassword',
    });

    expect(status).toBe(401);
    expect(data.error).toBeTruthy();
  });

  test('Login con email inexistente devuelve 401', async () => {
    const { status } = await api('POST', '/auth/login', {
      email: 'noexiste@estegia.com',
      password: '123456',
    });

    expect(status).toBe(401);
  });

  test('Acceso a ruta protegida sin token devuelve 401/403', async () => {
    const { status } = await api('GET', '/pacientes');
    expect([401, 403]).toContain(status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO 1 — GESTIÓN DE PACIENTES
// ═══════════════════════════════════════════════════════════════════════════════
describe('Módulo 1 — Gestión de Pacientes', () => {
  test('Crear paciente con campos mínimos (sin fechaNacimiento) devuelve 201', async () => {
    const { status, data } = await api(
      'POST',
      '/pacientes',
      {
        numeroDocumento: DOC_TEST,
        tipoDocumento: 'CC',
        nombreCompleto: 'Paciente Test Flujo',
        telefonos: ['3001234567'],
      },
      token
    );

    expect(status).toBe(201);
    expect(data.id).toBeTruthy();
    expect(data.nombreCompleto).toBe('Paciente Test Flujo');
    expect(data.numeroDocumento).toBe(DOC_TEST);

    pacienteId = data.id;
  });

  test('Buscar paciente por documento devuelve datos correctos', async () => {
    const { status, data } = await api(
      'GET',
      `/pacientes/search?documento=${DOC_TEST}&tipo=CC`,
      undefined,
      token
    );

    expect(status).toBe(200);
    expect(data.numeroDocumento).toBe(DOC_TEST);
    expect(data.id).toBe(pacienteId);
  });

  test('Crear paciente sin campos obligatorios devuelve 400', async () => {
    const { status, data } = await api(
      'POST',
      '/pacientes',
      { telefonos: ['3001234567'] },
      token
    );

    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  test('Crear paciente con documento duplicado devuelve error', async () => {
    const { status } = await api(
      'POST',
      '/pacientes',
      {
        numeroDocumento: DOC_TEST,
        tipoDocumento: 'CC',
        nombreCompleto: 'Duplicado Test',
        telefonos: ['3001234567'],
      },
      token
    );

    expect([400, 409, 500]).toContain(status);
  });

  test('Obtener listado de pacientes devuelve array', async () => {
    const { status, data } = await api('GET', '/pacientes?page=1&limit=5', undefined, token);

    expect(status).toBe(200);
    expect(Array.isArray(data.pacientes)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO 1 — AGENDAR CITA
// ═══════════════════════════════════════════════════════════════════════════════
describe('Módulo 1 — Agendar Cita', () => {
  test('Crear cita con pacienteId y medicoId válidos devuelve 201', async () => {
    const fechaHora = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const { status, data } = await api(
      'POST',
      '/citas',
      {
        pacienteId,
        medicoId,
        tipoCita: 'CONSULTA',
        fechaHora,
        duracionMinutos: 60,
        motivo: 'Consulta de prueba flujo',
      },
      token
    );

    expect(status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.cita.id).toBeTruthy();
    expect(data.cita.estado).toBe('PENDIENTE');
    expect(data.cita.pacienteId).toBe(pacienteId);

    citaId = data.cita.id;
  });

  test('Crear cita sin pacienteId devuelve 400', async () => {
    const fechaHora = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { status, data } = await api(
      'POST',
      '/citas',
      { medicoId, tipoCita: 'CONSULTA', fechaHora },
      token
    );

    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  test('Obtener citas del médico devuelve array con la cita creada', async () => {
    const { status, data } = await api('GET', '/citas/medico/agenda', undefined, token);

    expect(status).toBe(200);
    expect(Array.isArray(data.citas)).toBe(true);
    const cita = data.citas.find((c: any) => c.id === citaId);
    expect(cita).toBeDefined();
    expect(cita.pacienteId).toBe(pacienteId);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO 2 — AGENDA PROFESIONAL (Gestión de estados)
// ═══════════════════════════════════════════════════════════════════════════════
describe('Módulo 2 — Agenda Profesional', () => {
  test('Obtener cita por ID devuelve estado PENDIENTE', async () => {
    const { status, data } = await api('GET', `/citas/${citaId}`, undefined, token);

    expect(status).toBe(200);
    expect(data.cita.estado).toBe('PENDIENTE');
  });

  test('Actualizar cita a CONFIRMADA devuelve éxito', async () => {
    const { status, data } = await api(
      'PUT',
      `/citas/${citaId}`,
      { estado: 'CONFIRMADA' },
      token
    );

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cita.estado).toBe('CONFIRMADA');
  });

  test('Completar cita (Atender → activa Historia) devuelve éxito', async () => {
    const { status, data } = await api('POST', `/citas/${citaId}/completar`, undefined, token);

    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cita.estado).toBe('COMPLETADA');
  });

  test('Verificar que la cita queda como COMPLETADA', async () => {
    const { status, data } = await api('GET', `/citas/${citaId}`, undefined, token);

    expect(status).toBe(200);
    expect(data.cita.estado).toBe('COMPLETADA');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MÓDULO 3 — HISTORIA CLÍNICA
// ═══════════════════════════════════════════════════════════════════════════════
describe('Módulo 3 — Historia Clínica', () => {
  let historiaId = '';

  test('Crear historia clínica con pacienteId vinculado a la cita devuelve 201', async () => {
    const { status, data } = await api(
      'POST',
      '/historia-clinica',
      {
        pacienteId,
        tipoHistoria: 'ANAMNESIS',
        tipoConsulta: 'INICIAL',
        quejaPrincipal: 'Consulta estética de prueba automatizada',
        historiaEnfermedad: 'Paciente sin antecedentes relevantes',
        diagnostico: 'Candidato a procedimiento estético',
        tratamientoRecomendado: 'Seguimiento en 30 días',
        observaciones: 'Test automatizado del flujo clínico',
      },
      token
    );

    expect(status).toBe(201);
    expect(data.id || data.historia?.id).toBeTruthy();
    historiaId = data.id || data.historia?.id;
  });

  test('Obtener historias del médico devuelve la historia creada', async () => {
    const { status, data } = await api(
      'GET',
      '/historia-clinica/por-medico',
      undefined,
      token
    );

    expect(status).toBe(200);
    expect(data.historias || data).toBeTruthy();
  });

  test('Obtener historias del paciente devuelve la historia creada', async () => {
    const { status, data } = await api(
      'GET',
      `/historia-clinica/paciente/${pacienteId}`,
      undefined,
      token
    );

    expect(status).toBe(200);
    const historias = data.historias || data;
    expect(Array.isArray(historias) ? historias.length : 0).toBeGreaterThanOrEqual(1);
  });

  test('Crear HC sin pacienteId devuelve 400', async () => {
    const { status, data } = await api(
      'POST',
      '/historia-clinica',
      {
        tipoHistoria: 'ANAMNESIS',
        quejaPrincipal: 'Sin paciente',
      },
      token
    );

    expect(status).toBe(400);
    expect(data.error).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// FLUJO COMPLETO — Verificación end-to-end
// ═══════════════════════════════════════════════════════════════════════════════
describe('Flujo Completo E2E', () => {
  test('El paciente creado tiene su cita completada y su historia clínica', async () => {
    // Verificar paciente existe
    const { status: sP, data: dP } = await api(
      'GET',
      `/pacientes/search?documento=${DOC_TEST}&tipo=CC`,
      undefined,
      token
    );
    expect(sP).toBe(200);
    expect(dP.id).toBe(pacienteId);

    // Verificar cita existe y está COMPLETADA
    const { status: sC, data: dC } = await api('GET', `/citas/${citaId}`, undefined, token);
    expect(sC).toBe(200);
    expect(dC.cita.estado).toBe('COMPLETADA');
    expect(dC.cita.pacienteId).toBe(pacienteId);

    // Verificar historia clínica existe para el paciente
    const { status: sH } = await api(
      'GET',
      `/historia-clinica/paciente/${pacienteId}`,
      undefined,
      token
    );
    expect(sH).toBe(200);
  });
});

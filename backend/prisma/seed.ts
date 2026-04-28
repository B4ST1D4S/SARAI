import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // ============================================
  // 1. RINOPLASTIA (CUPS: 020306)
  // ============================================

  const rinoplastia = await prisma.procedimientoCUPS.upsert({
    where: { codigoCUPS: '020306' },
    update: {},
    create: {
      codigoCUPS: '020306',
      nombre: 'Rinoplastia',
      descripcion: 'Cirugía correctiva de la nariz',
      tipoCategoria: 'Facial',
      riesgoNivel: 'Medio',
      diasSeguimiento: 30,
      datosAdicionales: {
        duracionPromedio: '2-3 horas',
        anestesia: 'General',
        hospitalizacion: 'Ambulatoria',
      },
    },
  });

  // Plantilla de Historia Clínica para Rinoplastia
  const plantillaHistoriaRino = await prisma.plantillaTemplate.upsert({
    where: {
      codigoCUPS_tipo: {
        codigoCUPS: '020306',
        tipo: 'historia-clinica',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020306',
      nombre: 'Historia Clínica - Rinoplastia',
      tipo: 'historia-clinica',
      descripcion: 'Plantilla de historia clínica para procedimientos de rinoplastia',
      ordenVisualizacion: 1,
      requiereSignatura: true,
      requiereFoto: true,
      requiereMapaCorporal: false,
      seccionesJSON: [
        {
          id: 'anamnesis',
          nombre: 'Anamnesis',
          campos: [
            { id: 'motivo', label: 'Motivo de consulta', tipo: 'textarea', requerido: true },
            { id: 'expectativas', label: 'Expectativas del paciente', tipo: 'textarea', requerido: true },
            { id: 'problemasNasales', label: 'Problemas nasales previos', tipo: 'textarea', requerido: false },
          ],
        },
        {
          id: 'examen-fisico',
          nombre: 'Examen Físico',
          campos: [
            { id: 'altura', label: 'Altura de dorso nasal', tipo: 'text', requerido: true },
            { id: 'anchura', label: 'Anchura de base nasal', tipo: 'text', requerido: true },
            { id: 'punta', label: 'Proyección de punta', tipo: 'text', requerido: true },
            { id: 'observaciones', label: 'Observaciones', tipo: 'textarea', requerido: false },
          ],
        },
        {
          id: 'plan-quirurgico',
          nombre: 'Plan Quirúrgico',
          campos: [
            { id: 'tecnica', label: 'Técnica quirúrgica', tipo: 'select', opciones: ['Abierta', 'Cerrada'], requerido: true },
            { id: 'objetivos', label: 'Objetivos quirúrgicos', tipo: 'textarea', requerido: true },
          ],
        },
      ],
    },
  });

  // Checklist Pre-operatorio
  const checklistPreRino = await prisma.checklistTemplate.upsert({
    where: {
      codigoCUPS_fase: {
        codigoCUPS: '020306',
        fase: 'pre-operatorio',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020306',
      fase: 'pre-operatorio',
      nombre: 'Checklist Pre-operatorio - Rinoplastia',
      itemsJSON: [
        { id: 'consentimiento', label: 'Consentimiento firmado', requerido: true, orden: 1 },
        { id: 'anestesia', label: 'Evaluación anestesio', requerido: true, orden: 2 },
        { id: 'laboratorios', label: 'Laboratorios completos', requerido: true, orden: 3 },
        { id: 'fotos-base', label: 'Fotos basales capturadas', requerido: true, orden: 4 },
        { id: 'medicamentos', label: 'Suspensión de anticoagulantes', requerido: true, orden: 5 },
        { id: 'ayuno', label: 'Verificar ayuno 6 horas', requerido: true, orden: 6 },
      ],
      alertasAutomaticasJSON: [
        {
          dia: -1,
          mensaje: 'Confirmar asistencia a cirugía',
          tipo: 'info',
        },
      ],
    },
  });

  // Checklist Post-operatorio
  const checklistPostRino = await prisma.checklistTemplate.upsert({
    where: {
      codigoCUPS_fase: {
        codigoCUPS: '020306',
        fase: 'post-operatorio',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020306',
      fase: 'post-operatorio',
      nombre: 'Checklist Post-operatorio - Rinoplastia',
      itemsJSON: [
        { id: 'dolor', label: 'Evaluación del dolor', requerido: true, orden: 1 },
        { id: 'inflamacion', label: 'Grado de inflamación', requerido: true, orden: 2 },
        { id: 'drenaje', label: 'Presencia de drenaje', requerido: true, orden: 3 },
        { id: 'respira', label: 'Respiración nasal', requerido: true, orden: 4 },
        { id: 'medicamentos', label: 'Toma de medicamentos', requerido: true, orden: 5 },
      ],
      alertasAutomaticasJSON: [
        { dia: 1, mensaje: '¿Cómo te sientes? ¿Dolor intenso?', tipo: 'info' },
        { dia: 3, mensaje: 'Sube foto de cómo va la inflamación', tipo: 'info' },
        { dia: 7, mensaje: 'Cita de control, revisar curación', tipo: 'warning' },
        { dia: 15, mensaje: '¿Cómo va la respiración nasal?', tipo: 'info' },
        { dia: 30, mensaje: 'Evaluación final de resultados', tipo: 'critical' },
      ],
    },
  });

  // Consentimiento
  await prisma.consentimientoTemplate.upsert({
    where: { codigoCUPS: '020306' },
    update: {},
    create: {
      codigoCUPS: '020306',
      titulo: 'Consentimiento Informado - Rinoplastia',
      seccionesJSON: [
        {
          id: 'introduccion',
          titulo: 'Introducción',
          contenido:
            'He sido informado(a) sobre el procedimiento quirúrgico de RINOPLASTIA a realizarse bajo anestesia general.',
          requerido: true,
        },
        {
          id: 'beneficios',
          titulo: 'Beneficios Esperados',
          contenido: 'Mejora en la forma de la nariz, alineación y función respiratoria.',
          requerido: true,
        },
        {
          id: 'riesgos',
          titulo: 'Riesgos y Complicaciones',
          contenido: 'Se me han explicado los riesgos inherentes al procedimiento.',
          requerido: true,
        },
      ],
      riesgosJSON: [
        {
          riesgo: 'Sangrado excesivo',
          probabilidad: 'Baja',
          severidad: 'Alta',
          descripcion: 'Puede requerir transfusión',
        },
        {
          riesgo: 'Infección',
          probabilidad: 'Baja',
          severidad: 'Media',
          descripcion: 'Requiere antibióticos',
        },
        {
          riesgo: 'Resultado insatisfactorio',
          probabilidad: 'Media',
          severidad: 'Media',
          descripcion: 'Puede requerir retoque',
        },
        {
          riesgo: 'Problemas respiratorios',
          probabilidad: 'Baja',
          severidad: 'Alta',
          descripcion: 'Obstrucción nasal',
        },
      ],
      recomendacionesJSON: [
        { tipo: 'pre', texto: 'Suspender anticoagulantes 1 semana antes' },
        { tipo: 'pre', texto: 'Ayuno de 6 horas antes de la cirugía' },
        { tipo: 'post', texto: 'Reposo 3-4 semanas' },
        { tipo: 'post', texto: 'No hacer ejercicio 4-6 semanas' },
        { tipo: 'post', texto: 'Evitar golpes en la nariz mínimo 3 meses' },
      ],
    },
  });

  console.log('✅ Rinoplastia creada');

  // ============================================
  // 2. LIPOSUCCIÓN (CUPS: 020203)
  // ============================================

  const liposuccion = await prisma.procedimientoCUPS.upsert({
    where: { codigoCUPS: '020203' },
    update: {},
    create: {
      codigoCUPS: '020203',
      nombre: 'Liposucción',
      descripcion: 'Extracción quirúrgica de depósitos de grasa subcutánea',
      tipoCategoria: 'Corporal',
      riesgoNivel: 'Medio',
      diasSeguimiento: 30,
      datosAdicionales: {
        duracionPromedio: '1-4 horas',
        anestesia: 'General o Local',
        hospitalizacion: 'Ambulatoria',
      },
    },
  });

  const plantillaHistoriaLipo = await prisma.plantillaTemplate.upsert({
    where: {
      codigoCUPS_tipo: {
        codigoCUPS: '020203',
        tipo: 'historia-clinica',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020203',
      nombre: 'Historia Clínica - Liposucción',
      tipo: 'historia-clinica',
      descripcion: 'Plantilla de historia clínica para liposucción',
      ordenVisualizacion: 1,
      requiereSignatura: true,
      requiereFoto: true,
      requiereMapaCorporal: true,
      seccionesJSON: [
        {
          id: 'anamnesis',
          nombre: 'Anamnesis',
          campos: [
            {
              id: 'zonas',
              label: 'Zonas a tratar',
              tipo: 'checkbox',
              opciones: ['Abdomen', 'Cintura', 'Muslos', 'Brazos', 'Espalda'],
              requerido: true,
            },
            { id: 'volumen', label: 'Volumen estimado a extraer', tipo: 'number', requerido: true },
            { id: 'expectativas', label: 'Expectativas', tipo: 'textarea', requerido: true },
          ],
        },
        {
          id: 'examen-fisico',
          nombre: 'Examen Físico',
          campos: [
            { id: 'adiposidad', label: 'Grado de adiposidad', tipo: 'select', opciones: ['Leve', 'Moderada', 'Severa'], requerido: true },
            { id: 'piel', label: 'Elasticidad de piel', tipo: 'select', opciones: ['Buena', 'Regular', 'Pobre'], requerido: true },
            { id: 'observaciones', label: 'Observaciones', tipo: 'textarea', requerido: false },
          ],
        },
      ],
    },
  });

  const checklistPreLipo = await prisma.checklistTemplate.upsert({
    where: {
      codigoCUPS_fase: {
        codigoCUPS: '020203',
        fase: 'pre-operatorio',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020203',
      fase: 'pre-operatorio',
      nombre: 'Checklist Pre-operatorio - Liposucción',
      itemsJSON: [
        { id: 'consentimiento', label: 'Consentimiento firmado', requerido: true, orden: 1 },
        { id: 'anestesia', label: 'Evaluación anestesio', requerido: true, orden: 2 },
        { id: 'laboratorios', label: 'Laboratorios (CBC, BMP, Coagulación)', requerido: true, orden: 3 },
        { id: 'fotos', label: 'Fotos basales (frente, lateral, atrás)', requerido: true, orden: 4 },
        { id: 'mapa', label: 'Mapa corporal marcado', requerido: true, orden: 5 },
        { id: 'faja', label: 'Faja compresiva preparada', requerido: true, orden: 6 },
      ],
      alertasAutomaticasJSON: [
        { dia: -1, mensaje: 'Confirmar cirugía y preparar ropa cómoda', tipo: 'info' },
      ],
    },
  });

  const checklistPostLipo = await prisma.checklistTemplate.upsert({
    where: {
      codigoCUPS_fase: {
        codigoCUPS: '020203',
        fase: 'post-operatorio',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020203',
      fase: 'post-operatorio',
      nombre: 'Checklist Post-operatorio - Liposucción',
      itemsJSON: [
        { id: 'dolor', label: 'Evaluación del dolor (0-10)', requerido: true, orden: 1 },
        { id: 'edema', label: 'Grado de edema', requerido: true, orden: 2 },
        { id: 'drenaje', label: 'Cantidad de drenaje', requerido: true, orden: 3 },
        { id: 'movilidad', label: 'Movilidad limitada', requerido: true, orden: 4 },
        { id: 'faja', label: 'Uso de faja compresiva', requerido: true, orden: 5 },
      ],
      alertasAutomaticasJSON: [
        { dia: 1, mensaje: '¿Dolor? ¿Drenaje anormal? ¿Faja puesta?', tipo: 'critical' },
        { dia: 3, mensaje: 'Sube foto de cómo va el edema', tipo: 'warning' },
        { dia: 7, mensaje: 'Control: revisión de drenaje y edema', tipo: 'warning' },
        { dia: 15, mensaje: '¿Cómo vas? ¿Menos inflamación?', tipo: 'info' },
        { dia: 30, mensaje: 'Evaluación de resultados preliminares', tipo: 'critical' },
      ],
    },
  });

  await prisma.consentimientoTemplate.upsert({
    where: { codigoCUPS: '020203' },
    update: {},
    create: {
      codigoCUPS: '020203',
      titulo: 'Consentimiento Informado - Liposucción',
      seccionesJSON: [
        {
          id: 'introduccion',
          titulo: 'Introducción',
          contenido:
            'He sido informado(a) que me será realizado un procedimiento de LIPOSUCCIÓN bajo anestesia local o general.',
          requerido: true,
        },
        {
          id: 'beneficios',
          titulo: 'Beneficios',
          contenido:
            'Mejora en la silueta corporal, contorneado de cuerpo, reducción de depósitos adiposos localizados.',
          requerido: true,
        },
        {
          id: 'riesgos',
          titulo: 'Riesgos y Complicaciones',
          contenido: 'Se me han explicado los riesgos asociados a este procedimiento.',
          requerido: true,
        },
      ],
      riesgosJSON: [
        {
          riesgo: 'Sangrado',
          probabilidad: 'Baja',
          severidad: 'Alta',
          descripcion: 'Puede requerir transfusión',
        },
        {
          riesgo: 'Infección',
          probabilidad: 'Baja',
          severidad: 'Media',
          descripcion: 'Tratamiento con antibióticos',
        },
        {
          riesgo: 'Seromas',
          probabilidad: 'Media',
          severidad: 'Media',
          descripcion: 'Acumulación de líquido',
        },
        {
          riesgo: 'Irregularidades cutáneas',
          probabilidad: 'Media',
          severidad: 'Media',
          descripcion: 'Puede requerir procedimiento complementario',
        },
        {
          riesgo: 'Embolia grasa',
          probabilidad: 'Muy baja',
          severidad: 'Crítica',
          descripcion: 'Complicación sistémica grave',
        },
      ],
      recomendacionesJSON: [
        { tipo: 'pre', texto: 'Suspender aspirina y antiinflamatorios 1 semana antes' },
        { tipo: 'pre', texto: 'Ayuno mínimo 6 horas' },
        { tipo: 'post', texto: 'Usar faja compresiva 4-6 semanas' },
        { tipo: 'post', texto: 'Reposo 1-2 semanas' },
        { tipo: 'post', texto: 'Drenaje si aplica: cambiar según indicaciones' },
        { tipo: 'post', texto: 'Sin ejercicio 4-6 semanas' },
      ],
    },
  });

  console.log('✅ Liposucción creada');

  // ============================================
  // 3. BOTOX (CUPS: 020405)
  // ============================================

  const botox = await prisma.procedimientoCUPS.upsert({
    where: { codigoCUPS: '020405' },
    update: {},
    create: {
      codigoCUPS: '020405',
      nombre: 'Botox',
      descripcion: 'Inyección de toxina botulínica tipo A para rechazo dinámico',
      tipoCategoria: 'No-invasivo',
      riesgoNivel: 'Bajo',
      diasSeguimiento: 14,
      datosAdicionales: {
        duracionPromedio: '15-30 minutos',
        anestesia: 'Tópica o sin anestesia',
        hospitalizacion: 'Ambulatoria',
      },
    },
  });

  const plantillaHistoriaBotox = await prisma.plantillaTemplate.upsert({
    where: {
      codigoCUPS_tipo: {
        codigoCUPS: '020405',
        tipo: 'historia-clinica',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020405',
      nombre: 'Historia Clínica - Botox',
      tipo: 'historia-clinica',
      descripcion: 'Plantilla de historia clínica para aplicación de Botox',
      ordenVisualizacion: 1,
      requiereSignatura: true,
      requiereFoto: true,
      requiereMapaCorporal: false,
      seccionesJSON: [
        {
          id: 'anamnesis',
          nombre: 'Anamnesis',
          campos: [
            { id: 'areas', label: 'Áreas a tratar', tipo: 'checkbox', opciones: ['Frente', 'Cejas', 'Pata de gallo', 'Entrecejo'], requerido: true },
            { id: 'objetivos', label: 'Objetivos del paciente', tipo: 'textarea', requerido: true },
            { id: 'alergias', label: 'Alergias conocidas', tipo: 'textarea', requerido: false },
          ],
        },
        {
          id: 'examen-fisico',
          nombre: 'Examen Físico',
          campos: [
            {
              id: 'expresion',
              label: 'Patrón de expresión',
              tipo: 'select',
              opciones: ['Leve', 'Moderado', 'Severo'],
              requerido: true,
            },
            { id: 'observaciones', label: 'Observaciones', tipo: 'textarea', requerido: false },
          ],
        },
      ],
    },
  });

  const checklistPreBotox = await prisma.checklistTemplate.upsert({
    where: {
      codigoCUPS_fase: {
        codigoCUPS: '020405',
        fase: 'pre-operatorio',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020405',
      fase: 'pre-operatorio',
      nombre: 'Checklist Pre-aplicación - Botox',
      itemsJSON: [
        { id: 'consentimiento', label: 'Consentimiento firmado', requerido: true, orden: 1 },
        { id: 'fotos', label: 'Fotos basales capturadas', requerido: true, orden: 2 },
        { id: 'alergia', label: 'Verificar alergias', requerido: true, orden: 3 },
        { id: 'medicamentos', label: 'Revisar medicamentos (anticoagulantes)', requerido: true, orden: 4 },
      ],
    },
  });

  const checklistPostBotox = await prisma.checklistTemplate.upsert({
    where: {
      codigoCUPS_fase: {
        codigoCUPS: '020405',
        fase: 'post-operatorio',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020405',
      fase: 'post-operatorio',
      nombre: 'Checklist Post-aplicación - Botox',
      itemsJSON: [
        { id: 'inflamacion', label: 'Inflamación local', requerido: true, orden: 1 },
        { id: 'moretones', label: 'Moretones o hematomas', requerido: true, orden: 2 },
      ],
      alertasAutomaticasJSON: [
        { dia: 3, mensaje: 'Tomar foto para comparar cambios iniciales', tipo: 'info' },
        { dia: 7, mensaje: '¿Notas cambios? ¿Satisfecho con resultados?', tipo: 'info' },
        { dia: 14, mensaje: 'Máximo efecto. Foto de comparación final', tipo: 'critical' },
      ],
    },
  });

  await prisma.consentimientoTemplate.upsert({
    where: { codigoCUPS: '020405' },
    update: {},
    create: {
      codigoCUPS: '020405',
      titulo: 'Consentimiento Informado - Botox',
      seccionesJSON: [
        {
          id: 'introduccion',
          titulo: 'Introducción',
          contenido: 'He sido informado(a) que se me aplicará toxina botulínica tipo A (BOTOX).',
          requerido: true,
        },
        {
          id: 'beneficios',
          titulo: 'Beneficios',
          contenido: 'Reducción de arrugas dinámicas, rejuvenecimiento facial, mejora de expresión.',
          requerido: true,
        },
        {
          id: 'riesgos',
          titulo: 'Riesgos',
          contenido: 'Se me han explicado los riesgos y complicaciones posibles.',
          requerido: true,
        },
      ],
      riesgosJSON: [
        {
          riesgo: 'Hematoma/Moretón',
          probabilidad: 'Alta',
          severidad: 'Baja',
          descripcion: 'Desaparece en 1-2 semanas',
        },
        {
          riesgo: 'Edema temporal',
          probabilidad: 'Media',
          severidad: 'Baja',
          descripcion: 'Hinchazón local transitoria',
        },
        {
          riesgo: 'Asimetría',
          probabilidad: 'Baja',
          severidad: 'Media',
          descripcion: 'Puede requerir retoque',
        },
      ],
      recomendacionesJSON: [
        { tipo: 'pre', texto: 'Evitar antiinflamatorios 3 días antes' },
        { tipo: 'pre', texto: 'Hidratación óptima' },
        { tipo: 'post', texto: 'No frotar área tratada 4 horas' },
        { tipo: 'post', texto: 'Evitar ejercicio 24 horas' },
        { tipo: 'post', texto: 'Máximo efecto en 14 días' },
      ],
    },
  });

  console.log('✅ Botox creada');

  // ============================================
  // 4. ÁCIDO HIALURÓNICO (CUPS: 020404)
  // ============================================

  const acido = await prisma.procedimientoCUPS.upsert({
    where: { codigoCUPS: '020404' },
    update: {},
    create: {
      codigoCUPS: '020404',
      nombre: 'Ácido Hialurónico',
      descripcion: 'Inyección de rellenos de ácido hialurónico',
      tipoCategoria: 'No-invasivo',
      riesgoNivel: 'Bajo',
      diasSeguimiento: 14,
      datosAdicionales: {
        duracionPromedio: '30-45 minutos',
        anestesia: 'Tópica o sin anestesia',
        hospitalizacion: 'Ambulatoria',
      },
    },
  });

  const plantillaHistoriaAcido = await prisma.plantillaTemplate.upsert({
    where: {
      codigoCUPS_tipo: {
        codigoCUPS: '020404',
        tipo: 'historia-clinica',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020404',
      nombre: 'Historia Clínica - Ácido Hialurónico',
      tipo: 'historia-clinica',
      descripcion: 'Plantilla para aplicación de rellenos de ácido hialurónico',
      ordenVisualizacion: 1,
      requiereSignatura: true,
      requiereFoto: true,
      requiereMapaCorporal: false,
      seccionesJSON: [
        {
          id: 'anamnesis',
          nombre: 'Anamnesis',
          campos: [
            { id: 'areas', label: 'Áreas a rellenar', tipo: 'checkbox', opciones: ['Labios', 'Mejillas', 'Surcos nasogenianos', 'Mentón'], requerido: true },
            { id: 'volumen', label: 'Volumen deseado', tipo: 'select', opciones: ['Sutil', 'Moderado', 'Prominente'], requerido: true },
            { id: 'historial', label: 'Historial previo con rellenos', tipo: 'textarea', requerido: false },
          ],
        },
        {
          id: 'examen-fisico',
          nombre: 'Examen Físico',
          campos: [
            { id: 'deficits', label: 'Déficits de volumen identificados', tipo: 'textarea', requerido: true },
            { id: 'simetria', label: 'Simetría facial', tipo: 'textarea', requerido: false },
          ],
        },
      ],
    },
  });

  const checklistPreAcido = await prisma.checklistTemplate.upsert({
    where: {
      codigoCUPS_fase: {
        codigoCUPS: '020404',
        fase: 'pre-operatorio',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020404',
      fase: 'pre-operatorio',
      nombre: 'Checklist Pre-aplicación - Ácido Hialurónico',
      itemsJSON: [
        { id: 'consentimiento', label: 'Consentimiento firmado', requerido: true, orden: 1 },
        { id: 'fotos', label: 'Fotos basales', requerido: true, orden: 2 },
        { id: 'alergia', label: 'Verificar alergias a componentes', requerido: true, orden: 3 },
      ],
    },
  });

  const checklistPostAcido = await prisma.checklistTemplate.upsert({
    where: {
      codigoCUPS_fase: {
        codigoCUPS: '020404',
        fase: 'post-operatorio',
      },
    },
    update: {},
    create: {
      codigoCUPS: '020404',
      fase: 'post-operatorio',
      nombre: 'Checklist Post-aplicación - Ácido Hialurónico',
      itemsJSON: [
        { id: 'edema', label: 'Edema o inflamación', requerido: true, orden: 1 },
        { id: 'hematoma', label: 'Hematomas', requerido: true, orden: 2 },
        { id: 'simetrí', label: 'Simetría', requerido: true, orden: 3 },
      ],
      alertasAutomaticasJSON: [
        { dia: 1, mensaje: '¿Cómo te ves? ¿Inflamación normal?', tipo: 'info' },
        { dia: 7, mensaje: 'Foto de seguimiento, edema debería haber bajado', tipo: 'info' },
        { dia: 14, mensaje: 'Resultado final. ¿Satisfecho?', tipo: 'critical' },
      ],
    },
  });

  await prisma.consentimientoTemplate.upsert({
    where: { codigoCUPS: '020404' },
    update: {},
    create: {
      codigoCUPS: '020404',
      titulo: 'Consentimiento Informado - Ácido Hialurónico',
      seccionesJSON: [
        {
          id: 'introduccion',
          titulo: 'Introducción',
          contenido: 'He sido informado(a) que se me aplicará relleno de ácido hialurónico.',
          requerido: true,
        },
        {
          id: 'beneficios',
          titulo: 'Beneficios',
          contenido: 'Restauración de volumen, mejora de proporciones faciales, rejuvenecimiento.',
          requerido: true,
        },
        {
          id: 'durabilidad',
          titulo: 'Durabilidad',
          contenido: 'Los resultados típicamente duran 6-12 meses según el tipo de ácido hialurónico.',
          requerido: true,
        },
      ],
      riesgosJSON: [
        {
          riesgo: 'Edema e inflamación',
          probabilidad: 'Alta',
          severidad: 'Baja',
          descripcion: 'Normal, desaparece en 3-7 días',
        },
        {
          riesgo: 'Hematomas',
          probabilidad: 'Media',
          severidad: 'Baja',
          descripcion: 'Desaparece en 1-2 semanas',
        },
        {
          riesgo: 'Granulomas',
          probabilidad: 'Muy baja',
          severidad: 'Media',
          descripcion: 'Reacción inflamatoria crónica rara',
        },
      ],
      recomendacionesJSON: [
        { tipo: 'pre', texto: 'Evitar antiinflamatorios 3 días antes' },
        { tipo: 'pre', texto: 'Evitar alcohol 24 horas antes' },
        { tipo: 'post', texto: 'Frío local 15 minutos' },
        { tipo: 'post', texto: 'Sin masaje en área tratada 24 horas' },
        { tipo: 'post', texto: 'Sin ejercicio 24 horas' },
        { tipo: 'post', texto: 'Evitar calor 48 horas' },
      ],
    },
  });

  console.log('✅ Ácido Hialurónico creada');

  // ============================================
  // CONFIGURACIÓN DEL SISTEMA
  // ============================================

  await prisma.configuracionSistema.upsert({
    where: { clave: 'dias_seguimiento_default' },
    update: {},
    create: {
      clave: 'dias_seguimiento_default',
      valor: { dias: 30 },
      descripcion: 'Días de seguimiento por defecto para procedimientos',
    },
  });

  await prisma.configuracionSistema.upsert({
    where: { clave: 'whatsapp_enabled' },
    update: {},
    create: {
      clave: 'whatsapp_enabled',
      valor: { enabled: true },
      descripcion: 'Habilitar envío de alertas por WhatsApp',
    },
  });

  console.log('✅ Configuración del sistema creada');
  console.log('🌱 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType, BorderStyle, VerticalAlign, UnderlineType, HeadingLevel, convertInchesToTwip } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // PORTADA
      new Paragraph({
        text: '',
        spacing: { line: 360 }
      }),
      new Paragraph({
        text: '',
        spacing: { line: 360 }
      }),
      new Paragraph({
        text: '',
        spacing: { line: 360 }
      }),
      new Paragraph({
        text: 'SARAI',
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        run: { size: 80, bold: true, color: 'D4AF37' }
      }),
      new Paragraph({
        text: 'Sistema de Atención Clínica Inteligente',
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        run: { size: 32, color: '1F2937' }
      }),
      new Paragraph({
        text: 'PROPUESTA ECONÓMICA PROFESIONAL',
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        run: { size: 28, bold: true, color: '000000' }
      }),
      new Paragraph({
        text: 'Implementación y Soporte',
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        run: { size: 24, color: '6B7280' }
      }),

      // Línea separadora
      new Paragraph({
        border: {
          bottom: {
            color: 'D4AF37',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 24
          }
        },
        spacing: { after: 800 }
      }),

      // SECCIÓN 1: INTRODUCCIÓN
      new Paragraph({
        text: 'PROPUESTA ECONÓMICA DETALLADA POR SERVICIOS',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 300 },
        run: { size: 28, bold: true, color: 'D4AF37' },
        border: {
          bottom: {
            color: 'D4AF37',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6
          }
        }
      }),

      new Paragraph({
        text: 'SARAI transforma la operación clínica en una experiencia inteligente, automatizada y preparada para el futuro de la salud. Esta propuesta presenta una estrategia comercial premium diseñada para maximizar la eficiencia operativa y reducir costos administrativos significativamente.',
        spacing: { after: 400, line: 360 },
        run: { size: 22, color: '1F2937' }
      }),

      // SECCIÓN 2: DESGLOSE POR MÓDULOS Y SERVICIOS
      new Paragraph({
        text: '1. VALOR POR SERVICIOS Y MÓDULOS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      // Tabla de módulos
      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            height: { value: 400, rule: 'auto' },
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'MÓDULO', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'IMPLEMENTACIÓN', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'LICENCIA MENSUAL', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'SOPORTE ANUAL', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'IA INCLUIDA', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          // CONSULTA EXTERNA
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '🏥 CONSULTA EXTERNA', run: { bold: true } } )],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$18.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$2.850.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$4.800.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'SÍ', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          // CIRUGÍA
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '🔪 CIRUGÍA', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$22.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$3.500.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$5.800.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'SÍ', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          // HOSPITALIZACIÓN
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '🛏 HOSPITALIZACIÓN', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$20.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$3.200.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$5.200.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'SÍ', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          // URGENCIAS
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '🚑 URGENCIAS', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$16.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$2.600.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$4.200.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'SÍ', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          // LABORATORIO
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '🧪 LABORATORIO', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$14.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$2.100.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$3.800.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'SÍ', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          // FARMACIA E INVENTARIOS
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '💊 FARMACIA E INVENTARIOS', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$15.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$2.350.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$4.000.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'SÍ', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          // ADMINISTRATIVO Y GERENCIAL
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '📊 ADMINISTRATIVO Y GERENCIAL', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$12.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$1.800.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$3.200.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'SÍ', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          // IA Y AUTOMATIZACIÓN
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: '🤖 IA Y AUTOMATIZACIÓN', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$18.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$3.800.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$6.500.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'PREMIUM', run: { bold: true, color: 'D4AF37' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          })
        ]
      }),

      new Paragraph({ text: '', spacing: { after: 600 } }),

      // SECCIÓN 3: PLANES COMERCIALES
      new Paragraph({
        text: '2. PLANES COMERCIALES PREMIUM',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      // Tabla de Planes
      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            height: { value: 400, rule: 'auto' },
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'ASPECTO', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'PLAN BÁSICO', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: '6B7280' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'PLAN PROFESIONAL', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: '1F2937' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'PLAN ENTERPRISE', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: '000000' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Implementación', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$35.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$65.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'A MEDIDA', run: { bold: true, color: 'D4AF37' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Licencia Mensual', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$8.500.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$15.800.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'VARIABLE', run: { bold: true, color: 'D4AF37' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Soporte Anual', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$8.000.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$18.000.000', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'PRIORITARIO', run: { bold: true, color: 'D4AF37' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'IA Incluida', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'BÁSICA', run: { bold: true, color: '6B7280' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'AVANZADA', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'PREMIUM+', run: { bold: true, color: 'D4AF37' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Usuarios Incluidos', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Hasta 25', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Hasta 100', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'ILIMITADOS', run: { bold: true, color: 'D4AF37' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'ROI Estimado (Año 1)', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '250%', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '380%', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '>500%', run: { bold: true, color: 'D4AF37' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          })
        ]
      }),

      new Paragraph({ text: '', spacing: { after: 600 } }),

      // SECCIÓN 4: PROPUESTA DE VALOR
      new Paragraph({
        text: '3. PROPUESTA DE VALOR Y ROI',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      new Paragraph({
        text: 'Reducción de Costos Operativos',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: '• Automatización documental: Ahorro de 40% en carga administrativa',
        spacing: { after: 150, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: '• Dictado médico por IA: Reducción de 60% en tiempo de documentación',
        spacing: { after: 150, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: '• Optimización de agenda: Incremento de 35% en productividad médica',
        spacing: { after: 300, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'Optimización de Tiempo Médico',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: '• Menos tiempo en trámites: +15 minutos por paciente disponibles',
        spacing: { after: 150, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: '• Mejor experiencia de consulta: Mayor satisfacción del paciente',
        spacing: { after: 150, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: '• Mayor capacidad de atención: +8 pacientes/día por médico',
        spacing: { after: 300, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'Mejora de Calidad Asistencial',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: '• Historias clínicas completas: Menos omisiones de información',
        spacing: { after: 150, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: '• IA asistencial: Alertas inteligentes en tiempo real',
        spacing: { after: 150, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: '• Mejor seguimiento: Reducción de eventos adversos',
        spacing: { after: 300, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'Financiero y Administrativo',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: '• RIPS automatizado: Evita multas por rechazo',
        spacing: { after: 150, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: '• Facturación inteligente: +98% de eficiencia en cobro',
        spacing: { after: 150, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: '• Auditoría y compliance: Cumplimiento normativo automático',
        spacing: { after: 600, line: 300 },
        run: { size: 22 }
      }),

      // SECCIÓN 5: CÁLCULO DE ROI
      new Paragraph({
        text: '4. CÁLCULO DE RETORNO DE INVERSIÓN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      new Paragraph({
        text: 'Ejemplo: Clínica Mediana (150 camas, 80 médicos)',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 200 },
        run: { size: 24, bold: true, color: '1F2937' }
      }),

      // Tabla ROI
      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            height: { value: 400, rule: 'auto' },
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'CONCEPTO', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'AÑO 1', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'AÑO 2', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'AÑO 3', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Inversión Inicial', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$65.000.000', run: { bold: true, color: 'EF4444' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$0', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '$0', run: { bold: true } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Licencias Anuales', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$189.600.000', run: { bold: true, color: 'EF4444' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$189.600.000', run: { bold: true, color: 'EF4444' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$189.600.000', run: { bold: true, color: 'EF4444' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Soporte Anual', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$18.000.000', run: { bold: true, color: 'EF4444' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$18.000.000', run: { bold: true, color: 'EF4444' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$18.000.000', run: { bold: true, color: 'EF4444' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'COSTOS TOTALES', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '991B1B' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$272.600.000', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '991B1B' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$207.600.000', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '991B1B' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$207.600.000', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '991B1B' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Ahorro en Facturación', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$45.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$45.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$45.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Incremento de Ingresos (Capacidad)', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$125.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$125.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$125.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Reducción de Errores Clínicos', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$28.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$28.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$28.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Optimización de Inventarios', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$22.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$22.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$22.000.000', run: { bold: true, color: '059669' } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'BENEFICIOS TOTALES', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '065F46' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$220.000.000', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '065F46' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$220.000.000', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '065F46' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$220.000.000', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '065F46' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'UTILIDAD NETA', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-$52.600.000', run: { bold: true, color: '000000' } })],
                shading: { fill: 'D4AF37' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$12.400.000', run: { bold: true, color: '000000' } })],
                shading: { fill: 'D4AF37' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+$12.400.000', run: { bold: true, color: '000000' } })],
                shading: { fill: 'D4AF37' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'ROI %', run: { bold: true, color: 'FFFFFF' } })],
                shading: { fill: '1F2937' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '-19.3%', run: { bold: true, color: 'EF4444' } })],
                shading: { fill: '1F2937' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+6.0%', run: { bold: true, color: '059669' } })],
                shading: { fill: '1F2937' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '+6.0%', run: { bold: true, color: 'D4AF37' } })],
                shading: { fill: '1F2937' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          })
        ]
      }),

      new Paragraph({ text: '', spacing: { after: 600 } }),

      new Paragraph({
        text: 'Período de Recuperación: 18 meses',
        spacing: { before: 400, after: 200, line: 360 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: 'VPN a 5 años: $180.000.000',
        spacing: { after: 600, line: 360 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      // SECCIÓN 6: SERVICIOS INCLUIDOS
      new Paragraph({
        text: '5. SERVICIOS INCLUIDOS EN CADA PLAN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      new Paragraph({
        text: 'IMPLEMENTACIÓN',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '1F2937' }
      }),

      new Paragraph({
        text: '✔ Análisis de procesos y flujos',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Configuración del sistema según necesidades',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Migración de datos históricos',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Capacitación de usuarios administrativos y clínicos',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Pruebas de calidad y UAT',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Go live asistido',
        spacing: { after: 300, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'SOPORTE TÉCNICO Y CLÍNICO',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '1F2937' }
      }),

      new Paragraph({
        text: '✔ Help desk 24/7 (según plan)',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Actualizaciones y parches de seguridad',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Backup y recuperación de datos',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Auditoría de cumplimiento normativo',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Reportes ejecutivos mensuales',
        spacing: { after: 300, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'IA Y AUTOMATIZACIÓN',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '1F2937' }
      }),

      new Paragraph({
        text: '✔ Dictado médico por IA con transcripción automática',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Asistente conversacional SARAI',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Alertas clínicas inteligentes',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Automatización de documentos clínicos',
        spacing: { after: 600, line: 300 },
        run: { size: 22 }
      }),

      // SECCIÓN 7: OPCIONES DE IMPLEMENTACIÓN
      new Paragraph({
        text: '6. OPCIONES DE IMPLEMENTACIÓN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      new Paragraph({
        text: 'IMPLEMENTACIÓN COMPLETA (Recomendado)',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: 'Despliegue de todos los módulos simultáneamente',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Duración: 8-12 semanas',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Descuento: 15% en costo de implementación',
        spacing: { after: 300, line: 300 },
        run: { size: 22, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: 'IMPLEMENTACIÓN POR FASES',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '1F2937' }
      }),

      new Paragraph({
        text: 'Despliegue modular por áreas (máximo 3 módulos al mes)',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Duración: 4-6 meses',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Costo: Sin descuento (implementación extendida)',
        spacing: { after: 600, line: 300 },
        run: { size: 22, bold: true, color: 'EF4444' }
      }),

      // SECCIÓN 8: GARANTÍAS Y BENEFICIOS
      new Paragraph({
        text: '7. GARANTÍAS Y BENEFICIOS PREMIUM',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({
            height: { value: 400, rule: 'auto' },
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'GARANTÍA', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'DETALLE', run: { bold: true, color: 'FFFFFF', size: 22 } })],
                shading: { fill: 'D4AF37' },
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'SLA de Disponibilidad', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: '99.9% uptime garantizado', run: { size: 22 } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Garantía de Datos', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Backup diario con redundancia geográfica', run: { size: 22 } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Escalabilidad', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Expansión a nuevas sedes sin costo adicional (Plan Enterprise)', run: { size: 22 } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Actualizaciones Incluidas', run: { bold: true } })],
                shading: { fill: 'FFFFFF' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Nuevas funcionalidades 4x por año', run: { size: 22 } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: 'Integraciones', run: { bold: true } })],
                shading: { fill: 'F3F4F6' },
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              }),
              new TableCell({
                children: [new Paragraph({ text: 'Conexión con sistemas externos (laboratorios, farmacias, etc.)', run: { size: 22 } })],
                margins: { top: 100, bottom: 100, left: 100, right: 100 }
              })
            ]
          })
        ]
      }),

      new Paragraph({ text: '', spacing: { after: 600 } }),

      // SECCIÓN 9: POLÍTICA COMERCIAL
      new Paragraph({
        text: '8. POLÍTICA COMERCIAL Y DESCUENTOS',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      new Paragraph({
        text: 'CONTRATACIÓN ANUAL',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: 'Descuento 10% en licencia mensual si se paga anualmente',
        spacing: { after: 300, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'PLAN COMPLETO (Todos los módulos)',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: 'Descuento 15% en implementación',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Descuento 5% en licencias mensuales',
        spacing: { after: 300, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'REDES HOSPITALARIAS / MÚLTIPLES SEDES',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: 'Consultar tarifa especial corporativa',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Descuentos de 20-40% según volumen',
        spacing: { after: 300, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'PRIMERA SEDE PILOTO',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: 'Descuento 20% en implementación para proyecto piloto',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Duración: 6 meses (con opción a expansión)',
        spacing: { after: 600, line: 300 },
        run: { size: 22 }
      }),

      // SECCIÓN 10: TIMELINE
      new Paragraph({
        text: '9. CRONOGRAMA DE IMPLEMENTACIÓN',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 300 },
        run: { size: 26, bold: true, color: '000000' }
      }),

      new Paragraph({
        text: 'Semana 1-2: Análisis, planificación y kickoff',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Semana 3-4: Configuración del ambiente y migración de datos',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Semana 5-6: Capacitación intensiva de usuarios',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Semana 7-8: Pruebas UAT y ajustes finales',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Semana 9-10: Lanzamiento asistido',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: 'Semana 11-12: Estabilización y optimización',
        spacing: { after: 600, line: 300 },
        run: { size: 22 }
      }),

      // SECCIÓN 11: CIERRE COMERCIAL
      new Paragraph({
        border: {
          top: {
            color: 'D4AF37',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 24
          }
        },
        spacing: { before: 600, after: 400 }
      }),

      new Paragraph({
        text: 'PROPUESTA FINAL Y PRÓXIMOS PASOS',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 400 },
        run: { size: 28, bold: true, color: 'D4AF37' }
      }),

      new Paragraph({
        text: 'SARAI transforma la operación clínica en una experiencia inteligente, automatizada y preparada para el futuro de la salud.',
        spacing: { before: 200, after: 300, line: 360 },
        run: { size: 24, bold: true, color: '1F2937', italics: true }
      }),

      new Paragraph({
        text: 'Esta propuesta representa una inversión estratégica en tecnología médica de clase mundial que:',
        spacing: { after: 300, line: 360 },
        run: { size: 22, color: '374151' }
      }),

      new Paragraph({
        text: '✔ Reduce costos operativos en 40-60%',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Incrementa ingresos por mayor capacidad de atención',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Mejora la experiencia del paciente significativamente',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Garantiza cumplimiento normativo automático',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '✔ Posiciona la institución como líder tecnológico en salud',
        spacing: { after: 500, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'Período de recuperación: 18 meses | ROI Año 2: +380%',
        spacing: { before: 300, after: 600 },
        run: { size: 24, bold: true, color: '059669' }
      }),

      new Paragraph({
        text: 'CONDICIONES DE LA PROPUESTA',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: '1F2937' }
      }),

      new Paragraph({
        text: '• Vigencia: 30 días a partir de la entrega',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '• Firma de contrato: Dentro de 15 días',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '• Anticipo: 30% para inicio de implementación',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '• Saldo: 70% contra milestones de implementación',
        spacing: { after: 500, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        text: 'PRÓXIMOS PASOS',
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 150 },
        run: { size: 24, bold: true, color: 'D4AF37' }
      }),

      new Paragraph({
        text: '1. Revisión de la propuesta con equipo directivo (3 días)',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '2. Reunión de validación técnica y comercial (5 días)',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '3. Presentación de demostración en vivo (7 días)',
        spacing: { after: 100, line: 300 },
        run: { size: 22 }
      }),
      new Paragraph({
        text: '4. Firma de acuerdo y inicio de implementación (15 días)',
        spacing: { after: 600, line: 300 },
        run: { size: 22 }
      }),

      new Paragraph({
        border: {
          top: {
            color: 'D4AF37',
            space: 1,
            style: BorderStyle.SINGLE,
            size: 24
          }
        },
        spacing: { before: 400, after: 600 }
      }),

      new Paragraph({
        text: 'Desarrollado por: SARAI - Sistema de Atención Clínica Inteligente',
        alignment: AlignmentType.CENTER,
        spacing: { after: 100, line: 300 },
        run: { size: 20, color: '6B7280' }
      }),

      new Paragraph({
        text: 'Fecha: Mayo 2026 | Confidencial - Para uso exclusivo del cliente',
        alignment: AlignmentType.CENTER,
        spacing: { after: 100, line: 300 },
        run: { size: 20, color: '9CA3AF' }
      }),

      new Paragraph({
        text: 'www.sarai.health | contacto@sarai.health',
        alignment: AlignmentType.CENTER,
        spacing: { after: 0, line: 300 },
        run: { size: 20, bold: true, color: 'D4AF37' }
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Propuesta_Comercial_SARAI_2026.docx', buffer);
  console.log('✅ Propuesta generada exitosamente: Propuesta_Comercial_SARAI_2026.docx');
});

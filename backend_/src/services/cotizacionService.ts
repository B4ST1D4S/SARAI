import prisma from '../lib/prisma.js';
import nodemailer from 'nodemailer';

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'noreply@estegia.com',
    pass: process.env.SMTP_PASSWORD || 'password',
  },
});

export interface LineaItemCotizacion {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
}

export interface CreateCotizacionRequest {
  pacienteId: string;
  medicoId: string;
  citaId?: string;
  descripcionServicio: string;
  lineas: LineaItemCotizacion[];
  descuentoPorcentaje?: number;
  notasAdicionales?: string;
  vigenciaDias?: number;
}

// Crear cotización
export async function createCotizacion(data: CreateCotizacionRequest) {
  try {
    // Calcular totales
    const subtotal = data.lineas.reduce((sum, linea) => {
      return sum + linea.cantidad * linea.valorUnitario;
    }, 0);

    const descuento = data.descuentoPorcentaje
      ? (subtotal * data.descuentoPorcentaje) / 100
      : 0;

    const total = subtotal - descuento;

    // Crear cotización
    const cotizacion = await prisma.cotizacion.create({
      data: {
        pacienteId: data.pacienteId,
        medicoId: data.medicoId,
        citaId: data.citaId,
        descripcionServicio: data.descripcionServicio,
        lineas: data.lineas,
        subtotal,
        descuentoPorcentaje: data.descuentoPorcentaje || 0,
        descuentoValor: descuento,
        total,
        notasAdicionales: data.notasAdicionales,
        vigenciaHasta: new Date(Date.now() + (data.vigenciaDias || 30) * 24 * 60 * 60 * 1000),
        estado: 'GENERADA',
      },
      include: {
        paciente: {
          select: {
            id: true,
            nombreCompleto: true,
            email: true,
            numeroDocumento: true,
          },
        },
        medico: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    // Enviar cotización por email
    await sendCotizacionEmail(cotizacion);

    return cotizacion;
  } catch (error) {
    throw error;
  }
}

// Enviar cotización por email
async function sendCotizacionEmail(cotizacion: any) {
  try {
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
            .header { background: linear-gradient(135deg, #d4af37 0%, #c9a43f 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: white; padding: 20px; }
            .patient-info { background: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #d4af37; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th { background: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #d4af37; }
            .table td { padding: 10px; border-bottom: 1px solid #eee; }
            .table tr:hover { background: #f9f9f9; }
            .total-section { margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
            .total { color: #d4af37; }
            .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>COTIZACIÓN</h1>
              <p>EstetIA Clinic</p>
            </div>
            <div class="content">
              <div class="patient-info">
                <h3 style="margin-top: 0;">Información del Paciente</h3>
                <p><strong>Nombre:</strong> ${cotizacion.paciente.nombreCompleto}</p>
                <p><strong>Documento:</strong> ${cotizacion.paciente.numeroDocumento}</p>
                <p><strong>Email:</strong> ${cotizacion.paciente.email}</p>
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO')}</p>
              </div>

              <h3>Descripción del Servicio</h3>
              <p>${cotizacion.descripcionServicio}</p>

              <table class="table">
                <thead>
                  <tr>
                    <th>Descripción</th>
                    <th>Cantidad</th>
                    <th>Valor Unitario</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${cotizacion.lineas
                    .map(
                      (linea: any) => `
                    <tr>
                      <td>${linea.descripcion}</td>
                      <td>${linea.cantidad}</td>
                      <td>$${linea.valorUnitario.toLocaleString('es-CO')}</td>
                      <td>$${(linea.cantidad * linea.valorUnitario).toLocaleString('es-CO')}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>

              <div class="total-section">
                <div>Subtotal: $${cotizacion.subtotal.toLocaleString('es-CO')}</div>
                ${cotizacion.descuentoPorcentaje > 0 ? `<div>Descuento (${cotizacion.descuentoPorcentaje}%): -$${cotizacion.descuentoValor.toLocaleString('es-CO')}</div>` : ''}
                <div class="total">TOTAL: $${cotizacion.total.toLocaleString('es-CO')}</div>
              </div>

              ${cotizacion.notasAdicionales ? `<div style="margin-top: 20px; background: #fffaf0; padding: 15px; border-radius: 4px;"><strong>Notas:</strong><br>${cotizacion.notasAdicionales}</div>` : ''}

              <p style="margin-top: 30px; font-size: 12px; color: #999;">
                Esta cotización es válida hasta el ${new Date(cotizacion.vigenciaHasta).toLocaleDateString('es-CO')}
              </p>
            </div>
            <div class="footer">
              <p>EstetIA - Clínica de Cirugía Estética</p>
              <p>Teléfono: +57 (1) 2345678 | Email: contacto@estegia.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@estegia.com',
      to: cotizacion.paciente.email,
      subject: `Cotización EstetIA - ${cotizacion.descripcionServicio}`,
      html: htmlTemplate,
    });
  } catch (error) {
    console.error('Error enviando cotización por email:', error);
  }
}

// Obtener cotización por ID
export async function getCotizacionById(id: string) {
  try {
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id },
      include: {
        paciente: true,
        medico: true,
      },
    });

    if (!cotizacion) {
      throw new Error('Cotización no encontrada');
    }

    return cotizacion;
  } catch (error) {
    throw error;
  }
}

// Obtener cotizaciones de paciente
export async function getCotizacionesPaciente(pacienteId: string) {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      where: { pacienteId },
      include: {
        paciente: true,
        medico: true,
      },
      orderBy: { creadoEn: 'desc' },
    });

    return cotizaciones;
  } catch (error) {
    throw error;
  }
}

// Aceptar cotización
export async function aceptarCotizacion(id: string) {
  try {
    const cotizacion = await prisma.cotizacion.update({
      where: { id },
      data: {
        estado: 'ACEPTADA',
        aceptadaEn: new Date(),
      },
      include: {
        paciente: true,
        medico: true,
      },
    });

    return cotizacion;
  } catch (error) {
    throw error;
  }
}

// Rechazar cotización
export async function rechazarCotizacion(id: string, motivo?: string) {
  try {
    const cotizacion = await prisma.cotizacion.update({
      where: { id },
      data: {
        estado: 'RECHAZADA',
        rechazadaEn: new Date(),
        notasAdicionales: motivo ? `Rechazada: ${motivo}` : 'Rechazada',
      },
      include: {
        paciente: true,
        medico: true,
      },
    });

    return cotizacion;
  } catch (error) {
    throw error;
  }
}

// Listar cotizaciones del médico
export async function getCotizacionesMedico(medicoId: string) {
  try {
    const cotizaciones = await prisma.cotizacion.findMany({
      where: { medicoId },
      include: {
        paciente: {
          select: { id: true, nombreCompleto: true, email: true, numeroDocumento: true },
        },
        medico: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });
    return cotizaciones;
  } catch (error) {
    throw error;
  }
}

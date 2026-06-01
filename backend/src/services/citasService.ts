import prisma from '../lib/prisma.ts';
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

export interface CreateCitaRequest {
  pacienteId: string;
  medicoId: string;
  tipoCita: string;
  entidadSalud?: string;
  fechaHora: string;
  duracionMinutos?: number;
  motivo?: string;
  notas?: string;
}

export interface UpdateCitaRequest {
  estado?: 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';
  asistencia?: boolean;
  notas?: string;
  motivo?: string;
}

// Crear cita
export async function createCita(data: CreateCitaRequest) {
  try {
    const cita = await prisma.cita.create({
      data: {
        pacienteId: data.pacienteId,
        medicoId: data.medicoId,
        tipoCita: data.tipoCita,
        entidadSalud: data.entidadSalud,
        fechaHora: new Date(data.fechaHora),
        duracionMinutos: data.duracionMinutos || 60,
        motivo: data.motivo,
        notas: data.notas,
        estado: 'PENDIENTE',
      },
      include: {
        paciente: true,
        medico: true,
      },
    });

    // Enviar email de confirmación automático
    await sendCitaConfirmation(cita);

    return cita;
  } catch (error: any) {
    console.error('Error creando cita:', error);
    throw new Error(error.message || 'Error al crear cita');
  }
}

// Obtener citas del médico
export async function getCitasByMedico(medicoId: string, estado?: string, fechaInicio?: string, fechaFin?: string) {
  try {
    const where: any = { medicoId };
    if (estado) where.estado = estado;
    if (fechaInicio || fechaFin) {
      where.fechaHora = {};
      if (fechaInicio) where.fechaHora.gte = new Date(fechaInicio);
      if (fechaFin)    where.fechaHora.lte = new Date(fechaFin);
    }

    const citas = await prisma.cita.findMany({
      where,
      include: {
        paciente: true,
        medico: true,
      },
      orderBy: { fechaHora: 'asc' },
    });
    return citas;
  } catch (error: any) {
    console.error('Error obteniendo citas:', error);
    throw new Error(error.message || 'Error al obtener citas');
  }
}

// Obtener citas del paciente
export async function getCitasByPaciente(pacienteId: string) {
  try {
    const citas = await prisma.cita.findMany({
      where: { pacienteId },
      include: {
        paciente: true,
        medico: true,
      },
      orderBy: { fechaHora: 'desc' },
    });
    return citas;
  } catch (error: any) {
    console.error('Error obteniendo citas del paciente:', error);
    throw new Error(error.message || 'Error al obtener citas');
  }
}

// Obtener cita por ID
export async function getCitaById(citaId: string) {
  try {
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      include: {
        paciente: true,
        medico: true,
      },
    });
    return cita;
  } catch (error: any) {
    console.error('Error obteniendo cita:', error);
    throw new Error(error.message || 'Error al obtener cita');
  }
}

// Actualizar cita (cambiar estado, asistencia, etc)
export async function updateCita(citaId: string, data: UpdateCitaRequest) {
  try {
    const cita = await prisma.cita.update({
      where: { id: citaId },
      data: {
        estado: data.estado,
        asistencia: data.asistencia,
        notas: data.notas,
        motivo: data.motivo,
      },
      include: {
        paciente: true,
        medico: true,
      },
    });

    // Si la cita fue confirmada, enviar recordatorio
    if (data.estado === 'CONFIRMADA') {
      await sendCitaConfirmation(cita);
    }

    return cita;
  } catch (error: any) {
    console.error('Error actualizando cita:', error);
    throw new Error(error.message || 'Error al actualizar cita');
  }
}

// Cancelar cita
export async function cancelarCita(citaId: string, razon?: string) {
  try {
    const cita = await prisma.cita.update({
      where: { id: citaId },
      data: {
        estado: 'CANCELADA',
        notas: razon || 'Cita cancelada',
      },
      include: {
        paciente: true,
        medico: true,
      },
    });

    // Enviar email de cancelación
    await sendCitaCancellation(cita);

    return cita;
  } catch (error: any) {
    console.error('Error cancelando cita:', error);
    throw new Error(error.message || 'Error al cancelar cita');
  }
}

// Confirmar asistencia de paciente
export async function confirmarAsistencia(citaId: string) {
  try {
    const cita = await prisma.cita.update({
      where: { id: citaId },
      data: {
        asistencia: true,
        estado: 'CONFIRMADA',
      },
      include: {
        paciente: true,
        medico: true,
      },
    });
    return cita;
  } catch (error: any) {
    console.error('Error confirmando asistencia:', error);
    throw new Error(error.message || 'Error al confirmar asistencia');
  }
}

// Marcar cita como completada
export async function completarCita(citaId: string, notas?: string) {
  try {
    const cita = await prisma.cita.update({
      where: { id: citaId },
      data: {
        estado: 'COMPLETADA',
        asistencia: true,
        notas: notas || '',
      },
      include: {
        paciente: true,
        medico: true,
      },
    });
    return cita;
  } catch (error: any) {
    console.error('Error completando cita:', error);
    throw new Error(error.message || 'Error al completar cita');
  }
}

// Enviar confirmación de cita por email
async function sendCitaConfirmation(cita: any) {
  try {
    const fechaFormato = new Date(cita.fechaHora).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@estegia.com',
      to: cita.paciente.email,
      subject: '✅ Cita Confirmada - EstetIA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #c9a43f 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">EstetIA</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Sistema de Cirugía Estética Inteligente</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">¡Cita Confirmada!</h2>
            <p style="color: #666; font-size: 16px;">Estimado/a ${cita.paciente.nombreCompleto},</p>
            
            <div style="background: white; border-left: 4px solid #d4af37; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0 0 10px 0;"><strong>📅 Fecha y Hora:</strong></p>
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #d4af37;"><strong>${fechaFormato}</strong></p>
              
              <p style="margin: 0 0 10px 0;"><strong>👨‍⚕️ Médico:</strong></p>
              <p style="margin: 0 0 20px 0;">${cita.medico.nombre} ${cita.medico.apellido}</p>
              
              <p style="margin: 0 0 10px 0;"><strong>📝 Tipo de Cita:</strong></p>
              <p style="margin: 0;">${cita.tipoCita}</p>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⏰ Importante:</strong> Por favor llegue 15 minutos antes de la hora programada.
              </p>
            </div>

            <p style="color: #666; margin: 20px 0;">Si necesita reprogramar o cancelar su cita, responda a este email.</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                © 2026 EstetIA - Sistema de Cirugía Estética Inteligente
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email de confirmación enviado a:', cita.paciente.email);
  } catch (error) {
    console.error('❌ Error enviando email:', error);
  }
}

// Enviar cancelación de cita
async function sendCitaCancellation(cita: any) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@estegia.com',
      to: cita.paciente.email,
      subject: '❌ Cita Cancelada - EstetIA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #c9a43f 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">EstetIA</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #d32f2f; margin-top: 0;">Cita Cancelada</h2>
            <p style="color: #666;">Estimado/a ${cita.paciente.nombreCompleto},</p>
            <p style="color: #666;">Su cita ha sido cancelada. Si desea reagendar, por favor contacte con nosotros.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email de cancelación enviado');
  } catch (error) {
    console.error('❌ Error enviando email de cancelación:', error);
  }
}

// Enviar recordatorio 24 horas antes
export async function enviarRecordatorios24h() {
  try {
    const ahora = new Date();
    const mañana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000);

    const citas = await prisma.cita.findMany({
      where: {
        fechaHora: {
          gte: ahora,
          lte: mañana,
        },
        estado: 'CONFIRMADA',
      },
      include: {
        paciente: true,
        medico: true,
      },
    });

    for (const cita of citas) {
      await sendRecordatorio(cita);
    }

    console.log(`✅ ${citas.length} recordatorios enviados`);
    return citas.length;
  } catch (error: any) {
    console.error('Error enviando recordatorios:', error);
  }
}

async function sendRecordatorio(cita: any) {
  try {
    const fechaFormato = new Date(cita.fechaHora).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@estegia.com',
      to: cita.paciente.email,
      subject: '🔔 Recordatorio: Tu cita mañana - EstetIA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d4af37 0%, #c9a43f 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">EstetIA</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #d4af37;">🔔 Recordatorio de Cita</h2>
            <p style="color: #666; font-size: 16px;">Estimado/a ${cita.paciente.nombreCompleto},</p>
            <p style="color: #666;">Le recordamos que tiene una cita programada:</p>
            
            <div style="background: white; border-left: 4px solid #d4af37; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <p><strong>📅 ${fechaFormato}</strong></p>
              <p>Con: ${cita.medico.nombre} ${cita.medico.apellido}</p>
            </div>

            <p style="color: #666;">¡No olvide llegar 15 minutos antes!</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error enviando recordatorio:', error);
  }
}

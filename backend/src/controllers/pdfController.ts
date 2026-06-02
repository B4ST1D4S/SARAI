/**
 * pdfController.ts
 * Genera PDFs de Historia Clínica y Órdenes Médicas usando Puppeteer
 */
import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { buildHCHtml, buildOrdenesHtml } from '../utils/htmlTemplates.js';

async function htmlToPdf(html: string): Promise<Buffer> {
  // Dynamic imports requeridos porque puppeteer-core v25+ es ESM-only
  const [{ default: puppeteer }, { default: chromium }] = await Promise.all([
    import('puppeteer-core'),
    import('@sparticuz/chromium'),
  ]);

  const executablePath = process.env.VERCEL
    ? await chromium.executablePath()
    : undefined;

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '18mm', bottom: '15mm', left: '18mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function getClinicaParams(): Promise<Record<string, string>> {
  const rows = await prisma.parametroSistema.findMany({
    where: { grupo: 'clinica', estado: true },
  });
  const map: Record<string, string> = {};
  rows.forEach(r => { map[r.clave] = r.valor ?? ''; });
  return map;
}

async function getHistoriaConDatos(id: string) {
  return prisma.historiaClinica.findUnique({
    where: { id },
    include: {
      paciente: {
        select: {
          id: true,
          nombreCompleto: true,
          numeroDocumento: true,
          tipoDocumento: true,
          genero: true,
          fechaNacimiento: true,
          ciudad: true,
          telefonos: true,
          email: true,
        },
      },
      usuario: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          especialidad: true,
          registroMedico: true,
          registroProfesional: true,
          firmaBase64: true,
        },
      },
    },
  });
}

export async function descargarHCPdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) { res.status(400).json({ error: 'ID requerido' }); return; }

    const historia = await getHistoriaConDatos(id);
    if (!historia) { res.status(404).json({ error: 'Historia clínica no encontrada' }); return; }

    const clinica = await getClinicaParams();
    const html   = buildHCHtml(historia, clinica);
    const buffer = await htmlToPdf(html);

    const nombre = (historia.paciente?.nombreCompleto ?? 'HC').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="HistoriaClinica_${nombre}_${id.slice(-6)}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    console.error('Error generando PDF HC:', error);
    res.status(500).json({ error: error.message || 'Error generando PDF' });
  }
}

export async function descargarOrdenesPdf(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) { res.status(400).json({ error: 'ID requerido' }); return; }

    const historia = await getHistoriaConDatos(id);
    if (!historia) { res.status(404).json({ error: 'Historia clínica no encontrada' }); return; }

    const clinica = await getClinicaParams();
    const html   = buildOrdenesHtml(historia, clinica);
    const buffer = await htmlToPdf(html);

    const nombre = (historia.paciente?.nombreCompleto ?? 'OM').replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="OrdenesMedicas_${nombre}_${id.slice(-6)}.pdf"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    console.error('Error generando PDF Órdenes:', error);
    res.status(500).json({ error: error.message || 'Error generando PDF' });
  }
}

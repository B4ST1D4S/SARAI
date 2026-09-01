import fs from 'fs';
import prisma from '../lib/prisma.js';
import { buildHCHtml, buildOrdenesHtml } from '../utils/htmlTemplates.js';
/**
 * Busca un navegador (Chrome o Edge) instalado localmente para usarlo en desarrollo.
 * Se puede forzar la ruta con la variable de entorno PUPPETEER_EXECUTABLE_PATH.
 */
function findLocalBrowser() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    const candidates = process.platform === 'win32'
        ? [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        ]
        : process.platform === 'darwin'
            ? [
                '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            ]
            : [
                '/usr/bin/google-chrome',
                '/usr/bin/google-chrome-stable',
                '/usr/bin/chromium-browser',
                '/usr/bin/chromium',
                '/usr/bin/microsoft-edge',
            ];
    return candidates.find((p) => p && fs.existsSync(p));
}
async function htmlToPdf(html) {
    // Import dinámico para no cargar chromium en cada invocación serverless
    const [{ default: puppeteer }, { default: chromium }] = await Promise.all([
        import('puppeteer-core'),
        import('@sparticuz/chromium'),
    ]);
    let executablePath;
    if (process.env.VERCEL) {
        executablePath = await chromium.executablePath();
    }
    else {
        executablePath = findLocalBrowser();
        if (!executablePath) {
            throw new Error('No se encontró Chrome ni Edge instalado. Instala Google Chrome o define la variable PUPPETEER_EXECUTABLE_PATH con la ruta al ejecutable.');
        }
    }
    const browser = await puppeteer.launch({
        args: process.env.VERCEL ? chromium.args : ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: chromium.defaultViewport,
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
    }
    finally {
        await browser.close();
    }
}
async function getClinicaParams() {
    const rows = await prisma.parametroSistema.findMany({
        where: { grupo: 'clinica', estado: true },
    });
    const map = {};
    rows.forEach(r => { map[r.clave] = r.valor ?? ''; });
    return map;
}
async function getHistoriaConDatos(id) {
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
export async function descargarHCPdf(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'ID requerido' });
            return;
        }
        const historia = await getHistoriaConDatos(id);
        if (!historia) {
            res.status(404).json({ error: 'Historia clínica no encontrada' });
            return;
        }
        const clinica = await getClinicaParams();
        const html = buildHCHtml(historia, clinica);
        const buffer = await htmlToPdf(html);
        const nombre = (historia.paciente?.nombreCompleto ?? 'HC').replace(/\s+/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="HistoriaClinica_${nombre}_${id.slice(-6)}.pdf"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    }
    catch (error) {
        console.error('Error generando PDF HC:', error);
        res.status(500).json({ error: error.message || 'Error generando PDF' });
    }
}
export async function descargarOrdenesPdf(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'ID requerido' });
            return;
        }
        const historia = await getHistoriaConDatos(id);
        if (!historia) {
            res.status(404).json({ error: 'Historia clínica no encontrada' });
            return;
        }
        const clinica = await getClinicaParams();
        const html = buildOrdenesHtml(historia, clinica);
        const buffer = await htmlToPdf(html);
        const nombre = (historia.paciente?.nombreCompleto ?? 'OM').replace(/\s+/g, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="OrdenesMedicas_${nombre}_${id.slice(-6)}.pdf"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    }
    catch (error) {
        console.error('Error generando PDF Órdenes:', error);
        res.status(500).json({ error: error.message || 'Error generando PDF' });
    }
}

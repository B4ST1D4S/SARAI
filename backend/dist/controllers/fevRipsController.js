import * as svc from '../services/fevRipsDataService.js';
function ambienteDesdeRuta(req) {
    return req.path.startsWith('/produccion') || req.baseUrl.includes('produccion') ? 'PRODUCCION' : 'STAGE';
}
// ─── USUARIOS SISPRO ────────────────────────────────────────────────────────
export async function listUsuariosSispro(req, res) {
    try {
        const ambiente = req.query.ambiente;
        const usuarios = await svc.getUsuariosSispro(ambiente);
        res.json(usuarios.map(({ clave, ...rest }) => rest)); // nunca exponer la clave en listados
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
export async function createUsuarioSispro(req, res) {
    try {
        const usuario = await svc.createUsuarioSispro(req.body);
        const { clave, ...rest } = usuario;
        res.status(201).json(rest);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
export async function updateUsuarioSispro(req, res) {
    try {
        const usuario = await svc.updateUsuarioSispro(req.params.id, req.body);
        const { clave, ...rest } = usuario;
        res.json(rest);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
export async function deleteUsuarioSispro(req, res) {
    try {
        await svc.deleteUsuarioSispro(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
// ─── RIPS DE PRUEBA ─────────────────────────────────────────────────────────
export async function listRipsPruebas(_req, res) {
    try {
        res.json(await svc.getRipsPruebas());
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
export async function getRipsPrueba(req, res) {
    try {
        const rips = await svc.getRipsPruebaById(req.params.id);
        if (!rips) {
            res.status(404).json({ error: 'No encontrado' });
            return;
        }
        res.json(rips);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}
export async function createRipsPrueba(req, res) {
    try {
        const rips = await svc.createRipsPrueba(req.body);
        res.status(201).json(rips);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
export async function deleteRipsPrueba(req, res) {
    try {
        await svc.deleteRipsPrueba(req.params.id);
        res.status(204).send();
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
// ─── ENVÍO — rutas separadas /stage/* y /produccion/* ──────────────────────
// El ambiente se deriva de la ruta montada (ver routes/fevRips.ts), nunca del
// body, para que "de prueba" y "producción" queden físicamente separados.
export async function login(req, res) {
    try {
        const ambiente = ambienteDesdeRuta(req);
        const resultado = await svc.loginAmbiente(ambiente, req.body?.usuarioSisproId);
        res.json(resultado);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
export async function enviar(req, res) {
    try {
        const ambiente = ambienteDesdeRuta(req);
        const resultado = await svc.enviarRipsPrueba(ambiente, req.params.ripsPruebaId, req.body?.usuarioSisproId);
        res.json(resultado);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
export async function recuperarCuv(req, res) {
    try {
        const ambiente = ambienteDesdeRuta(req);
        const resultado = await svc.recuperarCuv(ambiente, req.body.codigoUnicoValidacion, req.body?.usuarioSisproId);
        res.json(resultado);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}
// ConsultarCUV no requiere ambiente separado por auth (uso ERP sin login),
// pero igual respeta la ruta para saber a qué contenedor preguntar.
export async function consultarCuv(req, res) {
    try {
        const ambiente = ambienteDesdeRuta(req);
        const resultado = await svc.consultarCuv(ambiente, req.body.codigoUnicoValidacion);
        res.json(resultado);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
}

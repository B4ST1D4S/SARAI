import prisma from '../lib/prisma.js';
import { createUser, getAllUsers, getUserById, updateUser, toggleUserStatus, } from '../services/usuariosService.js';
export async function create(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const { username, password, nombre, apellido, rol } = req.body;
        if (!username || !password || !nombre || !apellido || !rol) {
            res.status(400).json({
                error: 'username, password, nombre, apellido y rol son requeridos',
            });
            return;
        }
        const user = await createUser(req.body);
        res.status(201).json(user);
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'El nombre de usuario o correo ya existe' });
            return;
        }
        console.error('Error en createUser:', error);
        res.status(500).json({ error: error.message || 'Error al crear usuario' });
    }
}
export async function getAll(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const users = await getAllUsers();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Error al obtener usuarios' });
    }
}
export async function getById(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const user = await getUserById(req.params.id);
        if (!user) {
            res.status(404).json({ error: 'Usuario no encontrado' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Error al obtener usuario' });
    }
}
export async function update(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const user = await updateUser(req.params.id, req.body);
        res.json(user);
    }
    catch (error) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'El nombre de usuario o correo ya existe' });
            return;
        }
        res.status(500).json({ error: error.message || 'Error al actualizar usuario' });
    }
}
export async function toggleStatus(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        const result = await toggleUserStatus(req.params.id);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Error al cambiar estado' });
    }
}
// ── Carga masiva de usuarios desde CSV ──────────────────────────────────────
const ROLES_VALIDOS = ['SUPER_ADMIN', 'MEDICO', 'AUXILIAR', 'RECEPCIONISTA', 'PACIENTE'];
export async function cargaMasiva(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ error: 'Se requiere un archivo CSV' });
            return;
        }
        // Pre-cargar perfiles IAM para hacer lookup por nombre
        const perfilesDB = await prisma.perfil.findMany({ select: { id: true, nombre: true } });
        const perfilMap = {};
        for (const p of perfilesDB) {
            perfilMap[p.nombre.toLowerCase().trim()] = p.id;
        }
        const contenido = req.file.buffer.toString('utf-8');
        const lineas = contenido.split(/\r?\n/).filter(l => l.trim());
        if (lineas.length < 2) {
            res.status(400).json({ error: 'El archivo no tiene datos válidos' });
            return;
        }
        // Primera línea = encabezados (normalizar)
        const encabezados = lineas[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '_'));
        const idx = (campo) => encabezados.indexOf(campo);
        const creados = [];
        const errores = [];
        for (let i = 1; i < lineas.length; i++) {
            const cols = lineas[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            const get = (...campos) => {
                for (const c of campos) {
                    const v = cols[idx(c)];
                    if (v !== undefined && v !== '')
                        return v;
                }
                return '';
            };
            const username = get('username');
            const password = get('password');
            const nombre = get('nombre');
            const apellido = get('apellido');
            const rol = (get('rol') || 'RECEPCIONISTA').toUpperCase();
            const email = get('email');
            const telefono = get('telefono');
            const perfilNombre = get('perfil_iam', 'perfil');
            const tipoDocumento = get('tipo_documento', 'tipodocumento');
            const numeroDocumento = get('numero_documento', 'numerodocumento');
            const especialidad = get('especialidad');
            const registroProfesional = get('registro_profesional', 'registroprofesional');
            const registroMedico = get('registro_medico', 'registromedico');
            // Validaciones básicas
            if (!username || !password || !nombre || !apellido) {
                errores.push({ fila: i + 1, username: username || '(vacío)', error: 'Campos requeridos: username, password, nombre, apellido' });
                continue;
            }
            if (!ROLES_VALIDOS.includes(rol)) {
                errores.push({ fila: i + 1, username, error: `Rol inválido: "${rol}". Válidos: ${ROLES_VALIDOS.join(', ')}` });
                continue;
            }
            // Resolver perfilId por nombre
            let perfilId;
            if (perfilNombre) {
                perfilId = perfilMap[perfilNombre.toLowerCase().trim()];
                if (!perfilId) {
                    errores.push({ fila: i + 1, username, error: `Perfil IAM no encontrado: "${perfilNombre}"` });
                    continue;
                }
            }
            try {
                await createUser({
                    username,
                    password,
                    nombre,
                    apellido,
                    rol,
                    email: email || undefined,
                    telefono: telefono || undefined,
                    tipoDocumento: tipoDocumento || undefined,
                    numeroDocumento: numeroDocumento || undefined,
                    especialidad: especialidad || undefined,
                    registroProfesional: registroProfesional || undefined,
                    registroMedico: registroMedico || undefined,
                    perfilId: perfilId || undefined,
                });
                creados.push(username);
            }
            catch (e) {
                const msg = e.code === 'P2002' ? 'Username o email ya existe' : (e.message || 'Error desconocido');
                errores.push({ fila: i + 1, username, error: msg });
            }
        }
        res.json({
            total: lineas.length - 1,
            creados: creados.length,
            errores: errores.length,
            detalle: errores,
        });
    }
    catch (error) {
        console.error('Error carga masiva usuarios:', error);
        res.status(500).json({ error: error.message || 'Error en carga masiva' });
    }
}

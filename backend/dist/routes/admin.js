import { Router } from 'express';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import { 
// Especialidades
getEspecialidades, createEspecialidad, updateEspecialidad, deleteEspecialidad, bulkCreateEspecialidades, 
// HC Módulos
getHCModulos, createHCModulo, updateHCModulo, deleteHCModulo, 
// Departamentos
getDepartamentos, createDepartamento, updateDepartamento, deleteDepartamento, bulkCreateDepartamentos, 
// Servicios
getServicios, createServicio, updateServicio, deleteServicio, 
// Tipos Consulta
getTiposConsulta, getTipoConsultaById, createTipoConsulta, updateTipoConsulta, deleteTipoConsulta, bulkCreateTiposConsulta, 
// Config Servicios
getConfigServicios, addServicioAConsulta, removeServicioDeConsulta, 
// Reglas operativas
getReglasOperativas, upsertReglaOperativa, 
// Preparaciones
getPreparaciones, createPreparacion, updatePreparacion, deletePreparacion, 
// Cargos
getCargos, createCargo, updateCargo, deleteCargo, bulkCreateCargos, 
// Tipos Consultorio
getTiposConsultorio, createTipoConsultorio, updateTipoConsultorio, deleteTipoConsultorio, 
// Departamento × Cargo
getDepartamentoCargos, createDepartamentoCargo, updateDepartamentoCargo, deleteDepartamentoCargo, 
// Campos Paciente
getCamposPaciente, createCampoPaciente, updateCampoPaciente, deleteCampoPaciente, resetCamposPaciente, 
// Parámetros Sistema
getParametrosSistema, updateParametroSistema, 
// Listas de Valores
getListasValores, createListaValor, updateListaValor, deleteListaValor, 
// Motivos de Cita
getMotivosCita, createMotivoCita, updateMotivoCita, deleteMotivoCita, } from '../controllers/adminController.js';
import { getCupsCodigos, getCupsCodigosStats, createCupsCodigo, updateCupsCodigo, deleteCupsCodigo, bulkCreateCupsCodigos, } from '../controllers/cupsCatalogController.js';
import { 
// Clasificación
getTarifaGrupos, createTarifaGrupo, updateTarifaGrupo, deleteTarifaGrupo, createTarifaTipo, updateTarifaTipo, deleteTarifaTipo, 
// Cargos (equivalencia CUPS)
getCargosTarifa, getCargosTarifaStats, createCargoTarifa, updateCargoTarifa, deleteCargoTarifa, bulkCreateCargosTarifa, 
// Tarifarios
getTarifarios, getTarifarioById, createTarifario, updateTarifario, deleteTarifario, generarTarifarioDesdeBase, 
// Ítems
getTarifarioItems, upsertTarifarioItem, deleteTarifarioItem, bulkTarifarioItems, } from '../controllers/tarifasController.js';
const router = Router();
// ── Todos los endpoints requieren autenticación ──
router.use(authenticateToken);
// SUPER_ADMIN, MEDICO y AUXILIAR pueden crear/editar en parametrización
const onlyAdmin = authorizeRole('SUPER_ADMIN', 'MEDICO', 'AUXILIAR');
// ─────────────────────────────────────────
// ESPECIALIDADES
// ─────────────────────────────────────────
router.get('/especialidades', getEspecialidades);
router.post('/especialidades', onlyAdmin, createEspecialidad);
router.put('/especialidades/:id', onlyAdmin, updateEspecialidad);
router.delete('/especialidades/:id', onlyAdmin, deleteEspecialidad);
// ─────────────────────────────────────────
// HC MÓDULOS
// ─────────────────────────────────────────
router.get('/hc-modulos', getHCModulos);
router.post('/hc-modulos', onlyAdmin, createHCModulo);
router.put('/hc-modulos/:id', onlyAdmin, updateHCModulo);
router.delete('/hc-modulos/:id', onlyAdmin, deleteHCModulo);
// ─────────────────────────────────────────
// DEPARTAMENTOS
// ─────────────────────────────────────────
router.get('/departamentos', getDepartamentos);
router.post('/departamentos', onlyAdmin, createDepartamento);
router.put('/departamentos/:id', onlyAdmin, updateDepartamento);
router.delete('/departamentos/:id', onlyAdmin, deleteDepartamento);
// ─────────────────────────────────────────
// SERVICIOS FACTURABLES (CUPS)
// ─────────────────────────────────────────
router.get('/servicios', getServicios);
router.post('/servicios', onlyAdmin, createServicio);
router.put('/servicios/:id', onlyAdmin, updateServicio);
router.delete('/servicios/:id', onlyAdmin, deleteServicio);
// ─────────────────────────────────────────
// TIPOS DE CONSULTA
// ─────────────────────────────────────────
router.get('/tipos-consulta', getTiposConsulta);
router.get('/tipos-consulta/:id', getTipoConsultaById);
router.post('/tipos-consulta', onlyAdmin, createTipoConsulta);
router.put('/tipos-consulta/:id', onlyAdmin, updateTipoConsulta);
router.delete('/tipos-consulta/:id', onlyAdmin, deleteTipoConsulta);
// ─────────────────────────────────────────
// CONFIG SERVICIOS POR CONSULTA
// ─────────────────────────────────────────
router.get('/tipos-consulta/:tipoConsultaId/servicios', getConfigServicios);
router.post('/tipos-consulta/:tipoConsultaId/servicios', onlyAdmin, addServicioAConsulta);
router.delete('/config-servicios/:id', onlyAdmin, removeServicioDeConsulta);
// ─────────────────────────────────────────
// REGLAS OPERATIVAS
// ─────────────────────────────────────────
router.get('/departamentos/:departamentoId/reglas', getReglasOperativas);
router.post('/departamentos/:departamentoId/reglas', onlyAdmin, upsertReglaOperativa);
// ─────────────────────────────────────────
// PREPARACIONES
// ─────────────────────────────────────────
router.get('/preparaciones', getPreparaciones);
router.post('/preparaciones', onlyAdmin, createPreparacion);
router.put('/preparaciones/:id', onlyAdmin, updatePreparacion);
router.delete('/preparaciones/:id', onlyAdmin, deletePreparacion);
// ─────────────────────────────────────────
// CARGOS DE CONSULTA EXTERNA
// ─────────────────────────────────────────
router.get('/cargos', getCargos);
router.post('/cargos', onlyAdmin, createCargo);
router.post('/cargos/bulk', onlyAdmin, bulkCreateCargos);
router.put('/cargos/:id', onlyAdmin, updateCargo);
router.delete('/cargos/:id', onlyAdmin, deleteCargo);
// ─────────────────────────────────────────
// BULK (CARGUE MASIVO)
// ─────────────────────────────────────────
router.post('/especialidades/bulk', onlyAdmin, bulkCreateEspecialidades);
router.post('/departamentos/bulk', onlyAdmin, bulkCreateDepartamentos);
router.post('/tipos-consulta/bulk', onlyAdmin, bulkCreateTiposConsulta);
// ─────────────────────────────────────────
// TIPOS DE CONSULTORIO
// ─────────────────────────────────────────
router.get('/tipos-consultorio', getTiposConsultorio);
router.post('/tipos-consultorio', onlyAdmin, createTipoConsultorio);
router.put('/tipos-consultorio/:id', onlyAdmin, updateTipoConsultorio);
router.delete('/tipos-consultorio/:id', onlyAdmin, deleteTipoConsultorio);
// ─────────────────────────────────────────
// DEPARTAMENTO × CARGO
// ─────────────────────────────────────────
router.get('/departamentos/:departamentoId/cargos', getDepartamentoCargos);
router.post('/departamentos/:departamentoId/cargos', onlyAdmin, createDepartamentoCargo);
router.put('/departamento-cargos/:id', onlyAdmin, updateDepartamentoCargo);
router.delete('/departamento-cargos/:id', onlyAdmin, deleteDepartamentoCargo);
// ─────────────────────────────────────────
// CAMPOS DEL FORMULARIO DE PACIENTE
// ─────────────────────────────────────────
router.get('/campos-paciente', getCamposPaciente);
router.post('/campos-paciente', onlyAdmin, createCampoPaciente);
router.put('/campos-paciente/:id', onlyAdmin, updateCampoPaciente);
router.delete('/campos-paciente/:id', onlyAdmin, deleteCampoPaciente);
router.post('/campos-paciente/reset', onlyAdmin, resetCamposPaciente);
// ─────────────────────────────────────────
// PARÁMETROS DEL SISTEMA (key-value por grupo)
// ─────────────────────────────────────────
router.get('/parametros-sistema/:grupo', getParametrosSistema);
router.put('/parametros-sistema/:grupo/:clave', onlyAdmin, updateParametroSistema);
// ─────────────────────────────────────────
// LISTAS DE VALORES (selects del formulario)
// ─────────────────────────────────────────
router.get('/listas-valores', getListasValores);
router.post('/listas-valores', onlyAdmin, createListaValor);
router.put('/listas-valores/:id', onlyAdmin, updateListaValor);
router.delete('/listas-valores/:id', onlyAdmin, deleteListaValor);
// ─────────────────────────────────────────
// MOTIVOS DE CITA / CANCELACIÓN
// ─────────────────────────────────────────
router.get('/motivos-cita', getMotivosCita);
router.post('/motivos-cita', onlyAdmin, createMotivoCita);
router.put('/motivos-cita/:id', onlyAdmin, updateMotivoCita);
router.delete('/motivos-cita/:id', onlyAdmin, deleteMotivoCita);
// ─────────────────────────────────────────
// CATÁLOGO CUPS (Resolución 2706 de 2025)
// ─────────────────────────────────────────
router.get('/cups-codigos', getCupsCodigos);
router.get('/cups-codigos/stats', getCupsCodigosStats);
router.post('/cups-codigos', onlyAdmin, createCupsCodigo);
router.post('/cups-codigos/bulk', onlyAdmin, bulkCreateCupsCodigos);
router.put('/cups-codigos/:id', onlyAdmin, updateCupsCodigo);
router.delete('/cups-codigos/:id', onlyAdmin, deleteCupsCodigo);
// ─────────────────────────────────────────────────
// TARIFAS / TARIFARIOS
// ─────────────────────────────────────────────────
// Clasificación (grupos y tipos de cargo)
router.get('/tarifa-grupos', getTarifaGrupos);
router.post('/tarifa-grupos', onlyAdmin, createTarifaGrupo);
router.put('/tarifa-grupos/:id', onlyAdmin, updateTarifaGrupo);
router.delete('/tarifa-grupos/:id', onlyAdmin, deleteTarifaGrupo);
router.post('/tarifa-tipos', onlyAdmin, createTarifaTipo);
router.put('/tarifa-tipos/:id', onlyAdmin, updateTarifaTipo);
router.delete('/tarifa-tipos/:id', onlyAdmin, deleteTarifaTipo);
// Cargos (catálogo interno con equivalencia CUPS)
router.get('/cargos-tarifa', getCargosTarifa);
router.get('/cargos-tarifa/stats', getCargosTarifaStats);
router.post('/cargos-tarifa', onlyAdmin, createCargoTarifa);
router.post('/cargos-tarifa/bulk', onlyAdmin, bulkCreateCargosTarifa);
router.put('/cargos-tarifa/:id', onlyAdmin, updateCargoTarifa);
router.delete('/cargos-tarifa/:id', onlyAdmin, deleteCargoTarifa);
// Tarifarios (listas de precios)
router.get('/tarifarios', getTarifarios);
router.get('/tarifarios/:id', getTarifarioById);
router.post('/tarifarios', onlyAdmin, createTarifario);
router.put('/tarifarios/:id', onlyAdmin, updateTarifario);
router.delete('/tarifarios/:id', onlyAdmin, deleteTarifario);
router.post('/tarifarios/:id/generar-base', onlyAdmin, generarTarifarioDesdeBase);
// Ítems del tarifario (precios por cargo)
router.get('/tarifarios/:id/items', getTarifarioItems);
router.post('/tarifarios/:id/items', onlyAdmin, upsertTarifarioItem);
router.post('/tarifarios/:id/items/bulk', onlyAdmin, bulkTarifarioItems);
router.delete('/tarifarios/:id/items/:itemId', onlyAdmin, deleteTarifarioItem);
export default router;

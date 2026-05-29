# 💰 PRESUPUESTO Y COSTOS - ESTEGIA (PESOS COLOMBIANOS)

## 📊 RESUMEN EJECUTIVO

**EstetIA** es una plataforma SaaS premium para cirugía y medicina estética. Este documento detalla (EN PESOS COLOMBIANOS):

1. ✅ **Costos de desarrollo y deployment**
2. ✅ **Costos de infraestructura mensual/anual**
3. ✅ **Modelo de precios para clientes**
4. ✅ **ROI y análisis financiero**
5. ✅ **Propuesta de presupuestación cliente**

**Tasa de cambio usado**: 1 USD = $4,100 COP

---

## 🏗️ COSTOS DE DESARROLLO (ONE-TIME)

### FASE 1: MVP - Desarrollo Base
**Duración**: 2-3 meses | **Equipo**: 4 personas | **Costo**: $184,500,000 - $246,000,000 COP

| Item | Personas | Horas | Tasa/hr | Subtotal |
|------|----------|-------|---------|----------|
| **Backend** | 1 Dev Sr | 400 | $410,000 | $164,000,000 |
| **Frontend** | 1 Dev Sr | 300 | $410,000 | $123,000,000 |
| **QA/Testing** | 1 QA | 200 | $205,000 | $41,000,000 |
| **PM/Docs** | 1 PM | 100 | $307,500 | $30,750,000 |
| **Devops** | 1 DevOps | 100 | $369,000 | $36,900,000 |
| **Diseño UI** | 1 Designer | 150 | $287,000 | $43,050,000 |
| **Seguridad/Compliance** | 0.5 | 80 | $410,000 | $32,800,000 |
| **TOTAL FASE 1** | | **1,330h** | | **$471,500,000** |

---

### FASE 2: Premium Features (Modulo Visual + IA)
**Duración**: 2 meses | **Costo**: $143,050,000 - $184,500,000 COP

| Feature | Desarrollo | Integración | QA | Subtotal |
|---------|------------|-------------|-----|----------|
| Mapa corporal interactivo | $32,800,000 | $8,200,000 | $8,200,000 | **$49,200,000** |
| Timeline visual avanzado | $24,600,000 | $6,150,000 | $6,150,000 | **$36,900,000** |
| Integración Whisper (voz) | $28,700,000 | $8,200,000 | $6,150,000 | **$43,050,000** |
| Análisis visual con IA | $41,000,000 | $12,300,000 | $8,200,000 | **$61,500,000** |
| Integración WhatsApp | $20,500,000 | $8,200,000 | $4,100,000 | **$32,800,000** |
| CRM + Automación | $32,800,000 | $10,250,000 | $6,150,000 | **$49,200,000** |
| **TOTAL FASE 2** | | | | **$272,650,000** |

---

### FASE 3: Inteligencia Artificial + Escalabilidad
**Duración**: 2 meses | **Costo**: $123,000,000 - $164,000,000 COP

| Item | Costo |
|------|-------|
| Dictado clínico avanzado | $32,800,000 |
| Procesamiento de imágenes IA | $41,000,000 |
| Alertas predictivas | $32,800,000 |
| Optimización BD (sharding, replicación) | $28,700,000 |
| Load testing y performance tuning | $20,500,000 |
| Multi-tenant infrastructure | $32,800,000 |
| **TOTAL FASE 3** | **$188,600,000** |

---

### FASE 4: Certificaciones + Auditoría
**Duración**: 1 mes | **Costo**: $61,500,000 - $82,000,000 COP

| Item | Costo |
|------|-------|
| ISO 27001 (Seguridad) | $32,800,000 |
| Auditoría externa compliance (Colombia) | $28,700,000 |
| Penetration testing | $20,500,000 |
| Documentación legal + terms | $12,300,000 |
| **TOTAL FASE 4** | **$94,300,000** |

---

### INVERSIÓN TOTAL DE DESARROLLO
```
Fase 1 (MVP):           $471,500,000
Fase 2 (Premium):       $272,650,000
Fase 3 (IA + Scale):    $188,600,000
Fase 4 (Certificaciones): $94,300,000
───────────────────────────────────
TOTAL:                $1,027,050,000
```

**Duración**: 7-8 meses | **Equipo**: 4-5 personas

---

## ☁️ COSTOS DE INFRAESTRUCTURA (RECURRENTES)

### OPTION A: Hosting AWS (Recomendado)

#### Desarrollo/Staging
| Servicio | Specs | Costo/mes |
|----------|-------|----------|
| EC2 (Backend) | t3.small | $102,500 |
| RDS PostgreSQL | db.t3.small | $143,500 |
| MongoDB Atlas | 512MB | $0 (gratis) → $102,500 |
| ElastiCache Redis | cache.t3.micro | $82,000 |
| S3 Storage | <100GB | $10,250 |
| CloudFront CDN | 10GB | $20,500 |
| **Total Dev/Staging** | | **$358,750** |

#### Producción
| Servicio | Specs | Costo/mes |
|----------|-------|----------|
| EC2 (Backend) | t3.medium (2) | $246,000 |
| RDS PostgreSQL | db.t3.medium (Multi-AZ) | $615,000 |
| MongoDB Atlas | 5GB (3 nodos) | $938,900 |
| ElastiCache Redis | cache.t3.small | $143,500 |
| S3 Storage | 500GB | $47,150 |
| CloudFront CDN | 100GB | $34,850 |
| Load Balancer | ALB | $92,250 |
| NAT Gateway | 1 | $131,200 |
| Backup automático | Snapshots | $205,000 |
| **Total Producción** | | **$2,453,850** |

**Total AWS anual**: `$2,453,850 × 12 = $29,446,200/año` (sin incluir datos transferidos)

---

### OPTION B: Hosting Digital Ocean (Budget)

| Servicio | Specs | Costo/mes |
|----------|-------|----------|
| App Platform (Backend) | Standard | $205,000 |
| Droplet PostgreSQL | 4GB RAM | $196,800 |
| Spaces (S3 compatible) | 250GB | $20,500 |
| CDN | 250GB | $12,300 |
| Backups automáticos | Daily | $41,000 |
| **Total/mes** | | **$475,600** |

**Total anual**: `$475,600 × 12 = $5,707,200/año`

---

### OPTION C: Hosting Render.com (Simplificado)

| Servicio | Plan | Costo/mes |
|----------|------|----------|
| Backend | Professional | $205,000 |
| PostgreSQL | Standard | $123,000 |
| Redis | Standard | $61,500 |
| File storage | S3 compatible | $41,000 |
| **Total/mes** | | **$430,500** |

**Total anual**: `$430,500 × 12 = $5,166,000/año`

---

## 🔑 COSTOS DE SERVICIOS TERCEROS (APIS)

### APIs Pagas (Por Uso)
| Servicio | Caso de Uso | Costo |
|----------|-----------|-------|
| **OpenAI** | Transcripción (Whisper) + Análisis | $82/min audio |
| **Stripe** | Procesamiento pagos | 2.9% + $123 por transacción |
| **Twilio** | WhatsApp + SMS | $20.50/WhatsApp, $30.75/SMS |
| **SendGrid** | Email transaccional | $61,295/mes (100K emails) |
| **AWS SES** | Email alternativa | $410 por 1K emails |

### Estimación para 100 usuarios activos (1 consultorio)
| Servicio | Uso/mes | Costo/mes |
|----------|---------|----------|
| OpenAI (Whisper) | 100 horas grabación | $492,000 |
| Stripe | $10,000 en pagos | $1,307,900 |
| Twilio | 500 mensajes WhatsApp | $10,250 |
| SendGrid | 5,000 emails | $61,295 |
| **Total APIs/mes** | | **$1,871,445** |

**Total anual**: `$1,871,445 × 12 = $22,457,340`

---

## 👨‍💼 COSTOS DE OPERACIÓN (RECURRENTES)

### Equipo Mínimo para Soporte
| Rol | FTE | Sueldo/mes | Costo/mes |
|-----|-----|-----------|----------|
| Technical Support | 0.5 | $8,200,000 | $4,100,000 |
| Product Manager | 0.5 | $14,350,000 | $7,175,000 |
| DevOps/SRE | 0.5 | $14,350,000 | $7,175,000 |
| QA / Testing | 0.5 | $10,250,000 | $5,125,000 |
| **Total/mes** | | | **$23,575,000** |

**Total anual**: `$23,575,000 × 12 = $282,900,000`

---

### Otros Gastos Operacionales
| Item | Costo/mes |
|------|----------|
| Licencias de software (JetBrains, etc) | $820,000 |
| Monitoring & Analytics (DataDog, New Relic) | $1,230,000 |
| Security scanning (Snyk, Dependabot) | $615,000 |
| Documentation tools (Confluence) | $410,000 |
| Project management (Jira) | $328,000 |
| CI/CD (GitHub Actions, Jenkins) | $410,000 |
| **Total/mes** | **$3,813,000** |

**Total anual**: `$3,813,000 × 12 = $45,756,000`

---

## 📊 COSTO TOTAL DE OPERACIÓN ANUAL

```
┌────────────────────────────────────────────────┐
│  COSTOS ANUALES (SIN DESARROLLO)              │
├────────────────────────────────────────────────┤
│ Infraestructura AWS          $29,446,200      │
│ Servicios terceros (APIs)    $22,457,340      │
│ Equipo operación            $282,900,000      │
│ Otros gastos operacionales  $45,756,000       │
├────────────────────────────────────────────────┤
│ TOTAL ANUAL                $380,559,540       │
│ TOTAL MENSUAL              $31,713,295        │
└────────────────────────────────────────────────┘
```

**Nota**: Los costos de APIs escalan con volumen de usuarios.

---

## 💵 MODELO DE PRECIOS PARA CLIENTES

### OPCIÓN 1: Modelo SaaS (Recomendado)

#### Plan STARTER
- **Usuarios**: 1 médico + 1 asistente
- **Pacientes**: Hasta 500
- **Historia clínica**: Básica (sin IA)
- **Citas/mes**: Ilimitadas
- **Soporte**: Email (24h)
- **Precio**: **$815,900/mes** o **$8,159,000/año** (ahorro 16%)

#### Plan PROFESSIONAL
- **Usuarios**: 5 médicos + 3 asistentes
- **Pacientes**: Hasta 5,000
- **Historia clínica**: Dinámica + Plantillas
- **Módulo visual**: Timeline, Mapa corporal
- **Dictado Whisper**: Incluido
- **Consentimiento digital**: Incluido
- **Integración WhatsApp**: Incluido
- **Reportes**: Avanzados
- **Soporte**: Teléfono + Email (4h)
- **Precio**: **$2,045,900/mes** o **$20,459,000/año** (ahorro 16%)

#### Plan ENTERPRISE
- **Usuarios**: Ilimitados
- **Pacientes**: Ilimitados
- **Todas las features**: ✅
- **IA avanzada**: Análisis visual + Alertas predictivas
- **CRM + Facturación**: Incluido
- **Integración terceros**: Zapier, Make, etc
- **API access**: Full
- **Soporte**: Dedicado + WhatsApp
- **Onboarding personalizado**: 20 horas
- **Precio**: **$5,325,900/mes** o **$53,259,000/año** (ahorro 16%)

---

### OPCIÓN 2: Modelo Híbrido (Licencia + Mantenimiento)

#### Licencia Perpetua
- **Compra inicial**: $61,500,000 - $205,000,000 COP
- **Personalización**: Incluida (20 horas)
- **Instalación**: On-premise o cloud dedicado
- **Mantenimiento/año**: 20% del costo inicial

**Ejemplo**: Licencia $123,000,000 + Mantenimiento anual $24,600,000

---

### OPCIÓN 3: Modelo por Consultoría (Implementación)

#### Paquete Implementación Completa
- **Análisis inicial**: 40 horas ($16,400,000)
- **Configuración**: 60 horas ($24,600,000)
- **Capacitación**: 20 horas ($8,200,000)
- **Soporte 90 días**: Incluido ($12,300,000)
- **Total**: **$61,500,000**

**+ Suscripción mensual**: $1,225,450/mes (plan básico)

---

## 🎯 PROPUESTA DE PRESUPUESTO PARA CLIENTE

### PARA CONSULTORIO PEQUEÑO (1-2 médicos)

```markdown
# 📋 PROPUESTA COMERCIAL - EstetIA

## Cliente: Consultorio [Nombre]
## Fecha: [Fecha]
## Vigencia: 30 días

---

## SOLUCIÓN PROPUESTA

Sistema integral de gestión de historia clínica, citas y seguimiento para medicina estética.

### Alcance:
✅ Gestión de pacientes y citas
✅ Historia clínica dinámica con plantillas
✅ Consentimiento digital blindado
✅ Módulo visual (timeline, mapas corporales)
✅ Seguimiento postoperatorio automático
✅ Integración WhatsApp
✅ Reportes financieros

---

## PRESUPUESTO

### AÑO 1

| Concepto | Cantidad | V.Unitario | Subtotal |
|----------|----------|-----------|----------|
| Licencia anual PROFESSIONAL | 1 | $20,459,000 | $20,459,000 |
| Implementación + Capacitación | 1 | $12,300,000 | $12,300,000 |
| Soporte técnico 90 días | 1 | $4,100,000 | $4,100,000 |
| **TOTAL AÑO 1** | | | **$36,859,000** |
| Mensual promedio | | | $3,071,583/mes |

### AÑO 2 EN ADELANTE

| Concepto | Costo/año |
|----------|----------|
| Suscripción PROFESSIONAL | $20,459,000 |
| Soporte técnico anual | $4,920,000 |
| **TOTAL ANUAL** | **$25,379,000** |
| Mensual promedio | $2,114,917/mes |

---

## ROI (RETORNO SOBRE INVERSIÓN)

### Situación Actual
- Tiempo consulta: 30 min (20 min administrativo)
- Citas diarias: 8
- Tiempo administrativo: 160 min/día

### Con EstetIA
- Tiempo consulta: 7 min (2 min administrativo)
- Citas diarias: 15+ (aumento 88%)
- Tiempo administrativo: 30 min/día
- **Ahorro administrativo: 130 min/día** = 6.5 horas/día

### Cálculo de ROI
```
Tarifa médico: $820,000/hora
Ahorro diario: 6.5 horas × $820,000 = $5,330,000/día
Ahorro mensual: $5,330,000 × 20 días = $106,600,000/mes
Ahorro anual: $106,600,000 × 12 = $1,279,200,000

Inversión anual: $36,859,000
ROI = $1,279,200,000 / $36,859,000 = 3,470% ✅

Retorno en: <1 mes ⚡
```

**Conclusión**: El sistema se paga en <1 mes gracias al ahorro en carga administrativa y aumento de citas.

---

## BENEFICIOS ADICIONALES

✅ **Reducción riesgo legal**: 100% compliance normativa Colombia  
✅ **Mejor satisfacción paciente**: Interfaz premium, seguimiento automático  
✅ **Datos en tiempo real**: Reportes de ingresos, KPIs médicos  
✅ **Automatización**: Recordatorios WhatsApp, emails automáticos  
✅ **Escalabilidad**: Agregar médicos y pacientes sin costo adicional  

---

## TÉRMINOS

- **Validez**: 30 días
- **Pago**: 50% adelanto, 50% a la firma
- **Implementación**: 2 semanas
- **Garantía**: 1 año de soporte
- **Cancelación**: 30 días de aviso

---

**Contacto**: [correo] | [teléfono]
**Empresa**: EstetIA SaaS
```

---

## 🎯 COMPARATIVA: EstetIA vs Competencia

| Feature | EstetIA | SoftMedical | iMedical |
|---------|---------|------------|----------|
| Historia clínica dinámica | ✅ | ❌ | ✅ |
| Consentimiento digital | ✅ | ❌ | ❌ |
| Módulo visual (antes/después) | ✅ | ❌ | ✅ |
| Integración WhatsApp | ✅ | ❌ | ❌ |
| Dictado por voz (Whisper) | ✅ | ❌ | ❌ |
| Precio/mes | $815,900-5,325,900 | $615,000-1,640,000 | $1,230,000-3,280,000 |
| Compliance Colombia | ✅ | ⚠️ | ✅ |
| Interface premium | ✅ | ❌ | ⚠️ |

---

## 📊 ANÁLISIS FINANCIERO

### BREAK-EVEN ANALYSIS
```
Costo fijo anual: $380,559,540
Clientes necesarios (Plan Professional @ $2,045,900/mes):
$380,559,540 / ($2,045,900 × 12) = 16 clientes

Estimado:
15 clientes → Rentable en mes 12 ✅
25 clientes → Rentable en mes 6
50 clientes → Rentable en mes 3
```

### PROYECCIÓN 5 AÑOS

| Año | Clientes | Revenue | Costo Ops | Utilidad | Margen |
|-----|----------|---------|----------|----------|--------|
| 1 | 5 | $122,759,400 | $380,559,540 | -$257,800,140 | -210% |
| 2 | 20 | $491,037,600 | $451,000,000 | $40,037,600 | 8% |
| 3 | 50 | $1,227,594,000 | $533,000,000 | $694,594,000 | 57% |
| 4 | 100 | $2,455,188,000 | $656,000,000 | $1,799,188,000 | 73% |
| 5 | 150 | $3,682,782,000 | $779,000,000 | $2,903,782,000 | 79% |

**NPV @ 10% discount**: $4,920,000,000 COP (positivo desde año 2)

---

## 💡 ESTRATEGIAS DE PRESUPUESTACIÓN

### Para Cliente Nuevo
1. **Propuesta inicial**: Plan Starter ($815,900/mes)
2. **Upgrade en 3 meses**: Plan Professional (+$1,230,000/mes)
3. **Upsell anual**: Agregar médicos (+$820,000/médico/mes)
4. **ARPU target**: $2,460,000/mes en año 2

### Para Grandes Clínicas
1. **Negociar**: 20% descuento por volumen
2. **Ofrecer**: Licencia perpetua + mantenimiento
3. **Value-based**: Compartir % de aumento de ingresos

### Descuentos Negociables
- **Pago anual**: -15% (Plan Professional: $17,390,150 vs $20,459,000)
- **Multi-año**: -20% (3 años: $52,183,000 vs $61,377,000)
- **Volumen**: -25% (5+ licencias: $15,344,750 vs $20,459,000)

---

## 🔄 CICLO DE VENTA Y PRESUPUESTACIÓN

### FASE 1: Discovery (30 min)
- ✅ Tamaño del consultorio
- ✅ Volumen de pacientes
- ✅ Necesidades específicas
- ✅ Presupuesto disponible

### FASE 2: Demo Personalizado (60 min)
- ✅ Mostrar flujo específico para su caso
- ✅ Demostrar ROI con sus números
- ✅ Resolver objeciones

### FASE 3: Propuesta Comercial (escrita)
- ✅ Alcance detallado
- ✅ Cronograma implementación
- ✅ Presupuesto desglosado
- ✅ Términos de pago

### FASE 4: Contratación (2 semanas)
- ✅ Firma de contrato
- ✅ Pago inicial
- ✅ Kick-off implementación

**Ciclo total**: 30-45 días

---

## 📝 CHECKLIST DE PRESUPUESTACIÓN

### Antes de proponer:
- [ ] Confirmar tamaño del consultorio
- [ ] Entender sistema actual y problemas
- [ ] Calcular ROI con números reales del cliente
- [ ] Identificar decisor final (dueño, gerente)
- [ ] Conocer presupuesto aproximado disponible

### En la propuesta:
- [ ] Incluir desglose claro de costos
- [ ] Mostrar ROI en términos del cliente
- [ ] Especificar timeline de implementación
- [ ] Incluir términos de soporte
- [ ] Ofrecer periodo de prueba (30 días gratis)

### Después de venta:
- [ ] Implementación rápida (2 semanas)
- [ ] Capacitación completa del equipo
- [ ] Soporte proactivo primeros 90 días
- [ ] Seguimiento a 6 meses para upsell

---

## 🚀 CONCLUSIÓN

**EstetIA** ofrece:
- ✅ ROI positivo en <30 días
- ✅ Ahorro operacional inmediato (40-50%)
- ✅ Precios competitivos ($815,900-5,325,900/mes)
- ✅ Flexibilidad de modelos (SaaS, Híbrido, On-premise)
- ✅ Escalabilidad sin incremento de costo

**Margen típico**: 60-70% en plan Professional  
**Ciclo venta**: 30-45 días  
**Churn esperado**: <5% anual (high NPS)

---

**Versión**: 1.0 (COP)
**Fecha**: Mayo 2026  
**Tasa cambio**: 1 USD = 4,100 COP
**Próxima revisión**: Trimestral

# 💰 PRESUPUESTO Y COSTOS - ESTEGIA

## 📊 RESUMEN EJECUTIVO

**EstetIA** es una plataforma SaaS premium para cirugía y medicina estética. Este documento detalla:

1. ✅ **Costos de desarrollo y deployment**
2. ✅ **Costos de infraestructura mensual/anual**
3. ✅ **Modelo de precios para clientes**
4. ✅ **ROI y análisis financiero**
5. ✅ **Propuesta de presupuestación cliente**

---

## 🏗️ COSTOS DE DESARROLLO (ONE-TIME)

### FASE 1: MVP - Desarrollo Base
**Duración**: 2-3 meses | **Equipo**: 4 personas | **Costo**: $45,000 - $60,000

| Item | Personas | Horas | Tasa/hr | Subtotal |
|------|----------|-------|---------|----------|
| **Backend** | 1 Dev Sr | 400 | $100 | $40,000 |
| **Frontend** | 1 Dev Sr | 300 | $100 | $30,000 |
| **QA/Testing** | 1 QA | 200 | $50 | $10,000 |
| **PM/Docs** | 1 PM | 100 | $75 | $7,500 |
| **Devops** | 1 DevOps | 100 | $90 | $9,000 |
| **Diseño UI** | 1 Designer | 150 | $70 | $10,500 |
| **Seguridad/Compliance** | 0.5 | 80 | $100 | $8,000 |
| **TOTAL FASE 1** | | **1,330h** | | **$115,000** |

---

### FASE 2: Premium Features (Modulo Visual + IA)
**Duración**: 2 meses | **Costo**: $35,000 - $45,000

| Feature | Desarrollo | Integración | QA | Subtotal |
|---------|------------|-------------|-----|----------|
| Mapa corporal interactivo | $8,000 | $2,000 | $2,000 | **$12,000** |
| Timeline visual avanzado | $6,000 | $1,500 | $1,500 | **$9,000** |
| Integración Whisper (voz) | $7,000 | $2,000 | $1,500 | **$10,500** |
| Análisis visual con IA | $10,000 | $3,000 | $2,000 | **$15,000** |
| Integración WhatsApp | $5,000 | $2,000 | $1,000 | **$8,000** |
| CRM + Automación | $8,000 | $2,500 | $1,500 | **$12,000** |
| **TOTAL FASE 2** | | | | **$66,500** |

---

### FASE 3: Inteligencia Artificial + Escalabilidad
**Duración**: 2 meses | **Costo**: $30,000 - $40,000

| Item | Costo |
|------|-------|
| Dictado clínico avanzado | $8,000 |
| Procesamiento de imágenes IA | $10,000 |
| Alertas predictivas | $8,000 |
| Optimización BD (sharding, replicación) | $7,000 |
| Load testing y performance tuning | $5,000 |
| Multi-tenant infrastructure | $8,000 |
| **TOTAL FASE 3** | **$46,000** |

---

### FASE 4: Certificaciones + Auditoría
**Duración**: 1 mes | **Costo**: $15,000 - $20,000

| Item | Costo |
|------|-------|
| ISO 27001 (Seguridad) | $8,000 |
| Auditoría externa compliance (Colombia) | $7,000 |
| Penetration testing | $5,000 |
| Documentación legal + terms | $3,000 |
| **TOTAL FASE 4** | **$23,000** |

---

### INVERSIÓN TOTAL DE DESARROLLO
```
Fase 1 (MVP):           $115,000
Fase 2 (Premium):        $66,500
Fase 3 (IA + Scale):     $46,000
Fase 4 (Certificaciones): $23,000
───────────────────────────────
TOTAL:                  $250,500
```

**Duración**: 7-8 meses | **Equipo**: 4-5 personas

---

## ☁️ COSTOS DE INFRAESTRUCTURA (RECURRENTES)

### OPTION A: Hosting AWS (Recomendado)

#### Desarrollo/Staging
| Servicio | Specs | Costo/mes |
|----------|-------|----------|
| EC2 (Backend) | t3.small | $25 |
| RDS PostgreSQL | db.t3.small | $35 |
| MongoDB Atlas | 512MB | $0 (free) → $25 |
| ElastiCache Redis | cache.t3.micro | $20 |
| S3 Storage | <100GB | $2.50 |
| CloudFront CDN | 10GB | $5 |
| **Total Dev/Staging** | | **$87.50** |

#### Producción
| Servicio | Specs | Costo/mes |
|----------|-------|----------|
| EC2 (Backend) | t3.medium (2) | $60 |
| RDS PostgreSQL | db.t3.medium (Multi-AZ) | $150 |
| MongoDB Atlas | 5GB (3 nodos) | $229 |
| ElastiCache Redis | cache.t3.small | $35 |
| S3 Storage | 500GB | $11.50 |
| CloudFront CDN | 100GB | $8.50 |
| Load Balancer | ALB | $22.50 |
| NAT Gateway | 1 | $32 |
| Backup automático | Snapshots | $50 |
| **Total Producción** | | **$598.50** |

**Total AWS anual**: `$598.50 × 12 = $7,182/año` (sin incluir datos transferidos)

---

### OPTION B: Hosting Digital Ocean (Budget)

| Servicio | Specs | Costo/mes |
|----------|-------|----------|
| App Platform (Backend) | Standard | $50 |
| Droplet PostgreSQL | 4GB RAM | $48 |
| Spaces (S3 compatible) | 250GB | $5 |
| CDN | 250GB | $3 |
| Backups automáticos | Daily | $10 |
| **Total/mes** | | **$116** |

**Total anual**: `$116 × 12 = $1,392/año`

---

### OPTION C: Hosting Render.com (Simplificado)

| Servicio | Plan | Costo/mes |
|----------|------|----------|
| Backend | Professional | $50 |
| PostgreSQL | Standard | $30 |
| Redis | Standard | $15 |
| File storage | S3 compatible | $10 |
| **Total/mes** | | **$105** |

**Total anual**: `$105 × 12 = $1,260/año`

---

## 🔑 COSTOS DE SERVICIOS TERCEROS (APIS)

### APIs Pagas (Por Uso)
| Servicio | Caso de Uso | Costo |
|----------|-----------|-------|
| **OpenAI** | Transcripción (Whisper) + Análisis | $0.02/min audio |
| **Stripe** | Procesamiento pagos | 2.9% + $0.30 por transacción |
| **Twilio** | WhatsApp + SMS | $0.005/WhatsApp, $0.0075/SMS |
| **SendGrid** | Email transaccional | $14.95/mes (100K emails) |
| **AWS SES** | Email alternativa | $0.10 por 1K emails |

### Estimación para 100 usuarios activos (1 consultorio)
| Servicio | Uso/mes | Costo/mes |
|----------|---------|----------|
| OpenAI (Whisper) | 100 horas grabación | $120 |
| Stripe | $10,000 en pagos | $319 |
| Twilio | 500 mensajes WhatsApp | $2.50 |
| SendGrid | 5,000 emails | $14.95 |
| **Total APIs/mes** | | **$456.45** |

**Total anual**: `$456.45 × 12 = $5,477.40`

---

## 👨‍💼 COSTOS DE OPERACIÓN (RECURRENTES)

### Equipo Mínimo para Soporte
| Rol | FTE | Sueldo/mes | Costo/mes |
|-----|-----|-----------|----------|
| Technical Support | 0.5 | $2,000 | $1,000 |
| Product Manager | 0.5 | $3,500 | $1,750 |
| DevOps/SRE | 0.5 | $3,500 | $1,750 |
| QA / Testing | 0.5 | $2,500 | $1,250 |
| **Total/mes** | | | **$5,750** |

**Total anual**: `$5,750 × 12 = $69,000`

---

### Otros Gastos Operacionales
| Item | Costo/mes |
|------|----------|
| Licencias de software (JetBrains, etc) | $200 |
| Monitoring & Analytics (DataDog, New Relic) | $300 |
| Security scanning (Snyk, Dependabot) | $150 |
| Documentation tools (Confluence) | $100 |
| Project management (Jira) | $80 |
| CI/CD (GitHub Actions, Jenkins) | $100 |
| **Total/mes** | **$930** |

**Total anual**: `$930 × 12 = $11,160`

---

## 📊 COSTO TOTAL DE OPERACIÓN ANUAL

```
┌─────────────────────────────────────────┐
│     COSTOS ANUALES (SIN DESARROLLO)     │
├─────────────────────────────────────────┤
│ Infraestructura AWS          $7,182     │
│ Servicios terceros (APIs)    $5,477     │
│ Equipo operación            $69,000     │
│ Otros gastos operacionales  $11,160     │
├─────────────────────────────────────────┤
│ TOTAL ANUAL                 $92,819     │
│ TOTAL MENSUAL                $7,735     │
└─────────────────────────────────────────┘
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
- **Precio**: **$199/mes** ($815,900 COP) o **$1,990/año** ($8,159,000 COP) - Ahorro 16%

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
- **Precio**: **$499/mes** ($2,045,900 COP) o **$4,990/año** ($20,459,000 COP) - Ahorro 16%

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
- **Precio**: **$1,299/mes** ($5,325,900 COP) o **$12,990/año** ($53,259,000 COP) - Ahorro 16%

---

### OPCIÓN 2: Modelo Híbrido (Licencia + Mantenimiento)

#### Licencia Perpetua
- **Compra inicial**: $15,000 - $50,000
- **Personalización**: Incluida (20 horas)
- **Instalación**: On-premise o cloud dedicado
- **Mantenimiento/año**: 20% del costo inicial

**Ejemplo**: Licencia $30,000 + Mantenimiento anual $6,000

---

### OPCIÓN 3: Modelo por Consultoría (Implementación)

#### Paquete Implementación Completa
- **Análisis inicial**: 40 horas ($4,000)
- **Configuración**: 60 horas ($6,000)
- **Capacitación**: 20 horas ($2,000)
- **Soporte 90 días**: Incluido ($3,000)
- **Total**: **$15,000**

**+ Suscripción mensual**: $299/mes (plan básico)

---

## 📈 PROPUESTA DE PRESUPUESTO PARA CLIENTE

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
| Licencia anual PROFESSIONAL | 1 | $4,990 | $4,990 |
| Implementación + Capacitación | 1 | $3,000 | $3,000 |
| Soporte técnico 90 días | 1 | $1,000 | $1,000 |
| **TOTAL AÑO 1** | | | **$8,990** |
| Mensual promedio | | | $749/mes |

### AÑO 2 EN ADELANTE

| Concepto | Costo/año |
|----------|----------|
| Suscripción PROFESSIONAL | $4,990 |
| Soporte técnico anual | $1,200 |
| **TOTAL ANUAL** | **$6,190** |
| Mensual promedio | $516/mes |

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
Tarifa médico: $200/hora
Ahorro diario: 6.5 horas × $200 = $1,300/día
Ahorro mensual: $1,300 × 20 días = $26,000/mes
Ahorro anual: $26,000 × 12 = $312,000

Inversión anual: $8,990
ROI = $312,000 / $8,990 = 3,470% ✅

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
| Precio/mes | $199-1,299 | $150-400 | $300-800 |
| Compliance Colombia | ✅ | ⚠️ | ✅ |
| Interface premium | ✅ | ❌ | ⚠️ |

---

## 📊 ANÁLISIS FINANCIERO

### BREAK-EVEN ANALYSIS
```
Costo fijo anual: $92,819
Clientes necesarios (Plan Professional @ $499/mes):
$92,819 / ($499 × 12) = $92,819 / $5,988 = 16 clientes

Estimado:
15 clientes → Rentable en mes 12 ✅
25 clientes → Rentable en mes 6
50 clientes → Rentable en mes 3
```

### PROYECCIÓN 5 AÑOS

| Año | Clientes | Revenue | Costo Ops | Utilidad | Margen |
|-----|----------|---------|----------|----------|--------|
| 1 | 5 | $29,940 | $92,819 | -$62,879 | -210% |
| 2 | 20 | $119,760 | $110,000 | $9,760 | 8% |
| 3 | 50 | $299,400 | $130,000 | $169,400 | 57% |
| 4 | 100 | $598,800 | $160,000 | $438,800 | 73% |
| 5 | 150 | $898,200 | $190,000 | $708,200 | 79% |

**NPV @ 10% discount**: $1.2M (positivo desde año 2)

---

## 💡 ESTRATEGIAS DE PRESUPUESTACIÓN

### Para Cliente Nuevo
1. **Propuesta inicial**: Plan Starter ($199/mes)
2. **Upgrade en 3 meses**: Plan Professional (+$300/mes)
3. **Upsell anual**: Agregar médicos (+$200/médico/mes)
4. **ARPU target**: $600/mes en año 2

### Para Grandes Clínicas
1. **Negociar**: 20% descuento por volumen
2. **Ofrecer**: Licencia perpetua + mantenimiento
3. **Value-based**: Compartir % de aumento de ingresos

### Descuentos Negociables
- **Pago anual**: -15% (Plan Professional: $4,241 vs $5,988)
- **Multi-año**: -20% (3 años: $12,722 vs $17,982)
- **Volumen**: -25% (5+ licencias: $3,742 vs $4,990)

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
- ✅ Precios competitivos ($199-1,299/mes)
- ✅ Flexibilidad de modelos (SaaS, Híbrido, On-premise)
- ✅ Escalabilidad sin incremento de costo

**Margen típico**: 60-70% en plan Professional  
**Ciclo venta**: 30-45 días  
**Churn esperado**: <5% anual (high NPS)

---

**Versión**: 1.0  
**Fecha**: Mayo 2026  
**Próxima revisión**: Trimestral

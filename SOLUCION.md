# SOLUCIÓN — Reto Técnico 03
## Agente Conversacional de Órdenes de Compra SAP

### 1. Descripción

Aplicación desarrollada con Node.js 20+, TypeScript y Express para consultar solicitudes de compra, ejecutar validaciones de negocio y generar órdenes de compra SAP simuladas.

Incluye una interfaz web de chat, un motor de validación, confirmaciones humanas simuladas, idempotencia, persistencia local y registros de auditoría.

**Aplicación pública:** https://reto-03-sap-iz8t.onrender.com

**Repositorio:** https://github.com/katherinsr8000/RETO-03-SAP

### 2. Tecnologías

- Node.js 20+
- TypeScript
- Express
- HTML, CSS y JavaScript
- Zod
- OpenAI SDK (integración preparada, no operativa en el despliegue actual)
- JSON y JSONL para persistencia y auditoría local
- Render para despliegue web
- GitHub para control de versiones

### 3. Arquitectura

La solución se organiza en los siguientes componentes:

- **Interfaz web:** permite enviar mensajes y visualizar respuestas.
- **Servidor Express:** expone los servicios HTTP utilizados por el chat.
- **Agente de demostración:** interpreta solicitudes y comandos mediante reglas determinísticas.
- **Herramientas de consulta:** leen solicitudes, aprobaciones, cotizaciones, facturas y datos maestros.
- **Motor de validaciones:** aplica las reglas de negocio RC1 a RC10.
- **Preparación SAP:** transforma los datos validados al formato de la orden simulada.
- **Adaptador SAP simulado:** genera números de orden sin conectarse a SAP real.
- **Persistencia local:** almacena las órdenes simuladas en un archivo JSON.
- **Auditoría:** registra consultas, bloqueos, confirmaciones y operaciones de creación.

### 4. Funcionalidades implementadas

- Lectura de solicitudes y documentos relacionados.
- Consulta de maestros de proveedores.
- Validación de reglas RC1 a RC10.
- Identificación de bloqueos y confirmaciones pendientes.
- Derivación de datos necesarios para SAP.
- Preparación y creación de órdenes SAP simuladas.
- Chat web accesible públicamente.
- Confirmación explícita de solicitudes desde el chat.
- Prevención de órdenes duplicadas por identificador de solicitud.
- Persistencia local de órdenes en `out/ordenes-sap.json`.
- Registro de eventos en `out/auditoria.jsonl`.
- Demostración automatizada de los seis casos.

### 5. Casos de prueba

| Caso | Resultado esperado |
|---|---|
| sol-001 | Solicitud apta; permite crear orden simulada. |
| sol-002 | Bloqueo por proveedor inexistente o inválido. |
| sol-003 | Bloqueo por aprobador no autorizado. |
| sol-004 | Requiere confirmación por diferencia de cotización del 6 %. |
| sol-005 | Requiere confirmación por factura retroactiva. |
| sol-006 | Requiere confirmación por indicador de IVA derivado. |

### 6. Confirmaciones humanas

El chat permite reconocer instrucciones explícitas como `Confirmo sol-004`.

Cuando una solicitud requiere confirmación y no tiene bloqueos obligatorios, el sistema registra la confirmación de demostración y permite intentar nuevamente la creación de la orden.

Las confirmaciones se asocian al identificador de la solicitud y se registran como eventos de auditoría.

**Limitación:** el sistema no autentica la identidad ni verifica las facultades de la persona que confirma. La confirmación se mantiene en memoria durante la ejecución del servidor y no constituye una aprobación formal de SAP.

### 7. Idempotencia y persistencia

El adaptador SAP simulado verifica si existe una orden previamente creada para la misma solicitud.

Si existe, devuelve el número de orden anterior en lugar de generar uno nuevo.

Las órdenes se almacenan localmente en `out/ordenes-sap.json` y se recuperan al reiniciar el servidor local.

Se comprobó que dos ejecuciones de creación para `sol-001` devolvieron el mismo número SAP simulado, incluso después de reiniciar el servidor.

**Limitación:** la persistencia utiliza archivos locales y no garantiza consistencia ante solicitudes simultáneas. En Render Free, el almacenamiento es efímero y puede perderse durante reinicios o nuevos despliegues.

### 8. Auditoría

Se implementó un registro en formato JSONL que contiene:

- Fecha y hora del evento.
- Identificador de solicitud.
- Tipo de evento.
- Detalle de la operación.

Se registran eventos como `CONSULTA`, `BLOQUEO`, `CONFIRMACION`, `ORDEN_CREADA` y `ERROR`.

El registro permite revisar las acciones realizadas durante las pruebas locales.

**Limitación:** un evento `ORDEN_CREADA` puede registrar también la devolución de una orden previamente existente. La auditoría no constituye un registro inmutable ni identifica a usuarios autenticados.

### 9. Ejecución local

Instalar dependencias:

```bash
npm install
```

Verificar TypeScript:

```bash
npx tsc --noEmit
```

Ejecutar la demostración:

```bash
npm run demo
```

Ejecutar la aplicación:

```bash
npm start
```

Abrir el navegador en:

http://localhost:3000

### 10. Resultados de las pruebas

Se ejecutó `npm run demo` con resultados satisfactorios:

- Los seis casos fueron procesados.
- `sol-001` fue identificada como apta.
- `sol-002` y `sol-003` presentaron los bloqueos esperados.
- `sol-004`, `sol-005` y `sol-006` presentaron las confirmaciones esperadas.
- La prueba de idempotencia devolvió el mismo número de orden.
- La creación de `sol-004` fue rechazada sin confirmación y aceptada con una confirmación simulada.

La ejecución terminó con el mensaje:

**DEMOSTRACION FINALIZADA CORRECTAMENTE**

### 11. Integración con inteligencia artificial

Se preparó una integración inicial mediante el SDK de OpenAI.

Durante las pruebas se obtuvo un error HTTP 429 asociado a créditos insuficientes en la cuenta de API. Por este motivo, se habilitó un modo demostración que interpreta instrucciones mediante reglas determinísticas y utiliza las herramientas de validación y simulación.

**La versión actualmente desplegada no realiza llamadas operativas a un modelo de lenguaje.** El modo demostración no debe presentarse como una integración LLM funcional.

### 12. Seguridad y limitaciones

- No existe conexión con SAP real.
- No se crean órdenes en sistemas empresariales externos.
- Las confirmaciones son simuladas y no están autenticadas.
- Los archivos locales no proporcionan persistencia garantizada en Render Free.
- La idempotencia basada en archivos no cubre adecuadamente operaciones concurrentes.
- El modo demostración no utiliza un LLM operativo.
- La clave de API se configura mediante variables de entorno.
- El archivo `.env` está excluido del repositorio mediante `.gitignore`.

### 13. Uso de inteligencia artificial durante el desarrollo

Se utilizó ChatGPT como herramienta de apoyo para estructurar la solución, proponer código, resolver errores y preparar las pruebas.

Las validaciones y demostraciones descritas se ejecutaron localmente con los archivos del reto.

### 14. Conclusión

La solución demuestra un flujo de consulta, validación, confirmación y creación simulada de órdenes de compra SAP, con controles básicos de idempotencia y trazabilidad.

Quedan identificadas las mejoras necesarias para un entorno productivo: autenticación de aprobadores, almacenamiento transaccional persistente, auditoría robusta e integración operativa con un modelo de lenguaje y con SAP.
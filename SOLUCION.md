
# Agente de Compras SAP - Reto Técnico

## Descripción

Aplicación desarrollada con Node.js y TypeScript para consultar,
validar y preparar órdenes de compra SAP simuladas.

Incluye una interfaz web de chat, validaciones de negocio y
generación de órdenes simuladas.

## Tecnologías

- Node.js 20+
- TypeScript
- Express
- HTML, CSS y JavaScript
- Zod
- OpenAI SDK (integración preparada)

## Funcionalidades implementadas

- Lectura de solicitudes y documentos.
- Consulta de maestros de proveedores.
- Validaciones RC1 a RC10.
- Detección de bloqueos y confirmaciones pendientes.
- Derivación de datos del proveedor.
- Preparación de datos para SAP.
- Generación de órdenes SAP simuladas.
- Interfaz web de chat.
- Pruebas con seis solicitudes.

## Casos de prueba

- sol-001: solicitud apta; permite crear orden simulada.
- sol-002: bloqueada por proveedor inválido.
- sol-003: bloqueada por aprobador no autorizado.
- sol-004: requiere confirmar diferencia de cotización.
- sol-005: requiere confirmar retroactividad.
- sol-006: requiere confirmar IVA derivado.

## Ejecución local

Instalar dependencias:

npm install

Verificar TypeScript:

npx tsc --noEmit

Ejecutar pruebas:

npx tsx demo.ts
npx tsx demo-integracion.ts

Iniciar aplicación:

npx tsx src/server.ts

Abrir:

http://localhost:3000

## Integración con IA

Se implementó una versión inicial del agente con herramientas
para consultar solicitudes y crear órdenes simuladas.

La integración utiliza el SDK de OpenAI y requiere una clave
válida y créditos disponibles en la API.

Durante las pruebas se obtuvo un error 429 por falta de créditos,
por lo que se habilitó un modo demostración sin llamadas al LLM.

El modo demostración interpreta comandos mediante reglas
y utiliza el mismo motor de validaciones y simulación SAP.

No debe confundirse con un agente conversacional basado
en un modelo de lenguaje.

## Limitaciones

- No existe conexión con SAP real.
- Las órdenes son simuladas y no se almacenan permanentemente.
- Las confirmaciones humanas pendientes se detectan, pero
  todavía no pueden aprobarse desde el chat.
- El modo demostración no utiliza un LLM.
- El despliegue público queda sujeto a configuración.

## Uso de inteligencia artificial durante el desarrollo

Se utilizó ChatGPT como apoyo para diseñar la estructura,
generar propuestas de código, identificar errores y
preparar pruebas.

Las pruebas se ejecutaron localmente con los archivos
proporcionados para el reto.

## Seguridad

La clave de API se configura mediante variables de entorno.
El archivo .env no debe incluirse en el repositorio.

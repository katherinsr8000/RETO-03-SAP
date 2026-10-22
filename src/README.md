
# RETO-03-SAP

Reto técnico 03 - Agente conversacional de órdenes de compra SAP.

## Descripción

Aplicación desarrollada con TypeScript y Node.js para consultar
solicitudes de compra, validar reglas de negocio y generar órdenes
de compra simuladas.

Incluye una interfaz web de chat y seis casos de prueba.

## Tecnologías

- Node.js 20+
- TypeScript
- Express
- HTML, CSS y JavaScript
- OpenAI SDK (integración preparada)

## Instalación

Clonar el repositorio:

git clone https://github.com/katherinsr8000/RETO-03-SAP.git

Entrar a la carpeta:

cd RETO-03-SAP

Instalar dependencias:

npm install

## Ejecutar aplicación

npm start

Abrir en el navegador:

http://localhost:3000

## Ejecutar pruebas

npm run check

npm run demo

npm run demo:integracion

Las demostraciones utilizan los fixtures locales.

## Variables de entorno

PORT=3000

La integración original con OpenAI requiere además:

OPENAI_API_KEY=tu_clave
OPENAI_MODEL=gpt-4.1-mini

La versión actual utiliza un modo demostración basado en reglas
y no requiere créditos de API para funcionar.

Nunca subir el archivo .env al repositorio.

## Casos disponibles

- sol-001: compra apta.
- sol-002: proveedor no válido.
- sol-003: aprobación no autorizada.
- sol-004: diferencia entre solicitud y cotización.
- sol-005: compra retroactiva.
- sol-006: indicador de IVA derivado.

## API

GET /api/health

POST /api/chat

Ejemplo de solicitud:

{
  "mensaje": "Revisa la solicitud sol-001",
  "historial": []
}

Respuesta:

{
  "respuesta": "Resultado de la solicitud..."
}

## Limitaciones

- No se conecta con SAP real.
- La creación de órdenes es simulada.
- No existe persistencia de órdenes entre ejecuciones.
- Las confirmaciones pendientes todavía no se resuelven desde el chat.
- El modo actual no realiza llamadas a un modelo de lenguaje.

## Documentación

Ver SOLUCION.md para conocer las decisiones técnicas,
la cobertura implementada y las limitaciones.

## Uso de IA en el desarrollo

Se utilizó ChatGPT como apoyo en el desarrollo,
la estructuración de componentes y las pruebas.

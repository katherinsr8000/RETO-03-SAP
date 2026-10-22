# Agente de Compras SAP — Reto Técnico 03

Aplicación web desarrollada con **Node.js, TypeScript y Express** para consultar solicitudes de compra, validar reglas de negocio y generar órdenes SAP simuladas.

## Enlaces

**Aplicación pública:** https://reto-03-sap-iz8t.onrender.com

**Repositorio:** https://github.com/katherinsr8000/RETO-03-SAP

## Funcionalidades

- Consulta de solicitudes y documentos.
- Validaciones de negocio RC1 a RC10.
- Detección de bloqueos y confirmaciones pendientes.
- Creación simulada de órdenes SAP.
- Confirmaciones humanas de demostración desde el chat.
- Idempotencia por solicitud.
- Persistencia local en `out/ordenes-sap.json`.
- Registro de auditoría en `out/auditoria.jsonl`.
- Interfaz web pública.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación y ejecución

```bash
npm install
npm start
```

Abrir: http://localhost:3000

## Ejecutar las pruebas

```bash
npx tsc --noEmit
npm run demo
```

La demostración procesa seis casos y comprueba la idempotencia y el flujo de confirmación simulada.

## Casos disponibles

| Solicitud | Comportamiento |
|---|---|
| sol-001 | Orden apta |
| sol-002 | Proveedor inválido |
| sol-003 | Aprobador no autorizado |
| sol-004 | Confirmación por diferencia de cotización |
| sol-005 | Confirmación por retroactividad |
| sol-006 | Confirmación por IVA derivado |

## Ejemplos de uso del chat

- `Revisa la solicitud sol-001`
- `Crear orden para sol-001`
- `Crear orden para sol-002`
- `Crear orden para sol-004`
- `Confirmo sol-004`
- `Crear orden para sol-004`

## Limitaciones

La aplicación utiliza un **modo demostración basado en reglas determinísticas**, no un modelo de lenguaje operativo. La integración inicial con OpenAI quedó preparada, pero no pudo activarse por falta de créditos de API.

Las órdenes son simuladas: no se conectan a SAP real.

Las confirmaciones no autentican al aprobador. Las órdenes y registros se guardan en archivos locales; Render Free no garantiza su conservación entre despliegues. La solución no proporciona idempotencia transaccional ante solicitudes simultáneas.

## Documentación

Consulta `SOLUCION.md` para conocer la arquitectura, las decisiones técnicas, las pruebas y las limitaciones.
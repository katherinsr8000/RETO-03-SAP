
import { procesarOrden } from "./src/sap/procesar-orden.js";
import type { DatosOrdenSAP } from "./src/sap/crear-orden.js";
import type { ResultadoValidacion } from "./src/tools/tipos.js";

const datos: DatosOrdenSAP = {
  solicitud_id: "SOL-2026-001",
  proveedor_codigo_sap: "100234",
  descripcion: "Prueba de creación de orden SAP",
  centro_costo: "CC-1010",
  subarea: "Infraestructura",
  cantidad: 120,
  valor_unitario: 95000,
  valor_total: 11400000,
  moneda: "COP",
  indicador_iva: "C1",
  condiciones_pago: "Z030",
  retroactiva: false
};

const validacionApta: ResultadoValidacion = {
  apta: true,
  bloqueos: [],
  confirmaciones: [],
  derivados: {
    codigo_sap: "100234",
    indicador_iva: "C1",
    condiciones_pago: "Z030"
  },
  retroactiva: false
};

const validacionPendiente: ResultadoValidacion = {
  ...validacionApta,
  apta: false,
  confirmaciones: [
    "RC6: Se requiere confirmación humana."
  ]
};

console.log("\n========== ORDEN APTA ==========");
console.log(
  JSON.stringify(procesarOrden(validacionApta, datos), null, 2)
);

console.log("\n========== ORDEN PENDIENTE ==========");
console.log(
  JSON.stringify(procesarOrden(validacionPendiente, datos), null, 2)
);

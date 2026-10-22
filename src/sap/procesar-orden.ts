
import {
  crearOrdenSAP,
  type DatosOrdenSAP,
  type OrdenSAP
} from "./crear-orden.js";

import type { ResultadoValidacion } from "../tools/tipos.js";

export type ResultadoProcesamiento =
  | {
      creada: true;
      orden: OrdenSAP;
      mensaje: string;
    }
  | {
      creada: false;
      orden: null;
      mensaje: string;
      bloqueos: string[];
      confirmaciones: string[];
    };

export function procesarOrden(
  validacion: ResultadoValidacion,
  datos: DatosOrdenSAP
): ResultadoProcesamiento {
  if (
    !validacion.apta ||
    validacion.bloqueos.length > 0 ||
    validacion.confirmaciones.length > 0
  ) {
    return {
      creada: false,
      orden: null,
      mensaje:
        "No se puede crear la orden. Existen bloqueos o confirmaciones pendientes.",
      bloqueos: validacion.bloqueos,
      confirmaciones: validacion.confirmaciones
    };
  }

  if (
    !datos.proveedor_codigo_sap ||
    !datos.indicador_iva ||
    !datos.condiciones_pago
  ) {
    return {
      creada: false,
      orden: null,
      mensaje:
        "No se puede crear la orden. Faltan datos obligatorios para SAP.",
      bloqueos: ["Faltan datos obligatorios para SAP."],
      confirmaciones: []
    };
  }

  return {
    creada: true,
    orden: crearOrdenSAP(datos),
    mensaje: "Orden de compra SAP simulada creada correctamente."
  };
}


import type { DatosOrdenSAP } from "./crear-orden.js";
import type { ResultadoValidacion } from "../tools/tipos.js";

export type SolicitudParaSAP = {
  solicitud_id: string;
  descripcion: string;
  centro_costo: string;
  subarea: string;
  cantidad: number;
  valor_unitario: number;
  valor_total: number;
  moneda: string;
};

export function prepararDatosSAP(
  solicitud: SolicitudParaSAP,
  validacion: ResultadoValidacion
): DatosOrdenSAP | null {
  const {
    codigo_sap,
    indicador_iva,
    condiciones_pago
  } = validacion.derivados;

  if (
    !codigo_sap ||
    !indicador_iva ||
    !condiciones_pago
  ) {
    return null;
  }

  return {
    solicitud_id: solicitud.solicitud_id,
    proveedor_codigo_sap: codigo_sap,
    descripcion: solicitud.descripcion,
    centro_costo: solicitud.centro_costo,
    subarea: solicitud.subarea,
    cantidad: solicitud.cantidad,
    valor_unitario: solicitud.valor_unitario,
    valor_total: solicitud.valor_total,
    moneda: solicitud.moneda,
    indicador_iva,
    condiciones_pago,
    retroactiva: validacion.retroactiva
  };
}

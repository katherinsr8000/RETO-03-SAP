
import { randomUUID } from "node:crypto";

export type DatosOrdenSAP = {
  solicitud_id: string;
  proveedor_codigo_sap: string;
  descripcion: string;
  centro_costo: string;
  subarea: string;
  cantidad: number;
  valor_unitario: number;
  valor_total: number;
  moneda: string;
  indicador_iva: string;
  condiciones_pago: string;
  retroactiva: boolean;
};

export type OrdenSAP = DatosOrdenSAP & {
  numero_orden: string;
  estado: "CREADA_SIMULADA";
  fecha_creacion: string;
};

export function crearOrdenSAP(
  datos: DatosOrdenSAP
): OrdenSAP {
  const numero = randomUUID()
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase();

  return {
    ...datos,
    numero_orden: `SAP-SIM-${numero}`,
    estado: "CREADA_SIMULADA",
    fecha_creacion: new Date().toISOString()
  };
}

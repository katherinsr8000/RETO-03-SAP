
import { mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

export type EventoAuditoria =
  | "CONSULTA"
  | "BLOQUEO"
  | "CONFIRMACION"
  | "ORDEN_CREADA"
  | "ERROR";

export function registrarEvento(
  solicitudId: string,
  evento: EventoAuditoria,
  detalle: string
): void {
  const carpeta = join(process.cwd(), "out");
  const archivo = join(carpeta, "auditoria.jsonl");

  mkdirSync(carpeta, { recursive: true });

  const registro = {
    fecha: new Date().toISOString(),
    solicitud_id: solicitudId,
    evento,
    detalle
  };

  appendFileSync(
    archivo,
    JSON.stringify(registro) + "\n",
    "utf-8"
  );
}

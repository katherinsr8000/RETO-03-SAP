import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const ProveedorSchema = z.object({
  codigo_sap: z.string(),
  nit: z.string(),
  nombre: z.string(),
  condiciones_pago_default: z.string(),
  indicador_iva_default: z.string(),
  activo: z.boolean()
});

export type Proveedor = z.infer<typeof ProveedorSchema>;

export async function leerProveedores(
  directory: string
): Promise<Proveedor[]> {
  const ruta = path.join(
    directory,
    "fixtures",
    "reto-03",
    "maestros",
    "proveedores.json"
  );

  const contenido = await readFile(ruta, "utf-8");
  const datos: unknown = JSON.parse(contenido);

  return z.array(ProveedorSchema).parse(datos);
}

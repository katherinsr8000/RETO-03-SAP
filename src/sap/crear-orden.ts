
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

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

// Archivo donde guardaremos las órdenes simuladas.
const carpeta = join(process.cwd(), "out");
const archivo = join(carpeta, "ordenes-sap.json");

// Cargar las órdenes que ya estén guardadas.
function cargarOrdenes(): Map<string, OrdenSAP> {
    if (!existsSync(archivo)) {
        return new Map<string, OrdenSAP>();
    }

    const contenido = readFileSync(archivo, "utf-8");
    const ordenes = JSON.parse(contenido) as OrdenSAP[];

    return new Map(
        ordenes.map(orden => [orden.solicitud_id, orden])
    );
}

const ordenesCreadas = cargarOrdenes();

// Guardar las órdenes en el archivo JSON.
function guardarOrdenes(): void {
    mkdirSync(carpeta, { recursive: true });

    writeFileSync(
        archivo,
        JSON.stringify(
            Array.from(ordenesCreadas.values()),
            null,
            2
        ),
        "utf-8"
    );
}

export function crearOrdenSAP(
    datos: DatosOrdenSAP
): OrdenSAP {

    // Evitar órdenes duplicadas.
    const existente = ordenesCreadas.get(datos.solicitud_id);

    if (existente) {
        return existente;
    }

    const numero = randomUUID()
        .replace(/-/g, "")
        .slice(0, 10)
        .toUpperCase();

    const orden: OrdenSAP = {
        ...datos,
        numero_orden: `SAP-SIM-${numero}`,
        estado: "CREADA_SIMULADA",
        fecha_creacion: new Date().toISOString()
    };

    ordenesCreadas.set(datos.solicitud_id, orden);

    // Persistir la orden en disco.
    guardarOrdenes();

    return orden;
}


import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";

type Contexto = {
    directory: string;
    sessionId: string;
};

async function leerArchivo(
    ruta: string
): Promise<string | null> {
    try {
        return await readFile(ruta, "utf-8");
    } catch (error) {
        if (
            error instanceof Error &&
            "code" in error &&
            error.code === "ENOENT"
        ) {
            return null;
        }
        throw error;
    }
}

function extraerMonto(texto: string): number | null {
    const limpio = texto.replace(/[^\d.,]/g, "");
    if (!limpio) return null;

    const numero = Number(limpio.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(numero) ? numero : null;
}

function normalizarCotizacion(texto: string) {
    const proveedor =
        texto.match(/^Proveedor:\s*(.+)$/im)?.[1]?.trim() ?? "";

    const nit =
        texto.match(/^NIT:\s*(.+)$/im)?.[1]?.trim() ?? null;

    const totalTexto =
        texto.match(/^TOTAL\s*\(IVA incluido\):\s*(.+)$/im)?.[1];

    const total = totalTexto ? extraerMonto(totalTexto) : null;

    const moneda =
        totalTexto?.match(/\b(COP|USD)\b/i)?.[1]?.toUpperCase() ?? "COP";

    const fechaTexto =
        texto.match(/^Fecha:\s*(\d{4}-\d{2}-\d{2})/im)?.[1];

    const diasTexto =
        texto.match(/Validez de la oferta:\s*(\d+)\s*d[ií]as/i)?.[1];

    let validez_hasta: string | null = null;

    if (fechaTexto && diasTexto) {
        const fecha = new Date(`${fechaTexto}T00:00:00Z`);
        fecha.setUTCDate(fecha.getUTCDate() + Number(diasTexto));
        validez_hasta = fecha.toISOString().slice(0, 10);
    }

    if (!proveedor || total === null) {
        throw new Error("La cotización no contiene proveedor o total válido");
    }

    return {
        proveedor,
        nit,
        total,
        moneda,
        validez_hasta,
        texto
    };
}

export const leer_paquete = {
    description:
        "Lee y normaliza el correo, solicitud, cotización, aprobación y factura de un caso.",

    args: {
        caso: z.string().regex(/^sol-\d{3}$/)
            .describe("Carpeta de solicitud, por ejemplo sol-001")
    },

    async execute(
        args: { caso: string },
        ctx: Contexto
    ): Promise<string> {
        try {
            const validacion = this.args.caso.safeParse(args.caso);

            if (!validacion.success) {
                return JSON.stringify({
                    ok: false,
                    error: "Identificador de caso inválido"
                });
            }

            const carpeta = path.join(
                ctx.directory,
                "fixtures",
                "reto-03",
                "solicitudes",
                args.caso
            );

            const [
                correoTexto,
                solicitudTexto,
                cotizacionTexto,
                aprobacionTexto,
                facturaTexto
            ] = await Promise.all([
                leerArchivo(path.join(carpeta, "correo.json")),
                leerArchivo(path.join(carpeta, "solicitud.json")),
                leerArchivo(path.join(carpeta, "cotizacion.txt")),
                leerArchivo(path.join(carpeta, "aprobacion.json")),
                leerArchivo(path.join(carpeta, "factura.txt"))
            ]);

            if (!correoTexto || !solicitudTexto) {
                return JSON.stringify({
                    ok: false,
                    error: "Falta correo.json o solicitud.json",
                    faltantes: [
                        ...(!correoTexto ? ["correo.json"] : []),
                        ...(!solicitudTexto ? ["solicitud.json"] : [])
                    ]
                });
            }

            const correo = JSON.parse(correoTexto);
            const solicitud = JSON.parse(solicitudTexto);

            const aprobacion = aprobacionTexto
                ? JSON.parse(aprobacionTexto)
                : null;

            const paquete = {
                correo: {
                    id: correo.id,
                    de: correo.de,
                    asunto: correo.asunto,
                    fecha: correo.fecha
                },
                solicitud,
                cotizacion: cotizacionTexto
                    ? normalizarCotizacion(cotizacionTexto)
                    : null,
                aprobacion: aprobacion
                    ? {
                        de: aprobacion.de,
                        fecha: aprobacion.fecha,
                        aprobado: /\baprobado\b/i.test(aprobacion.cuerpo),
                        texto: aprobacion.cuerpo
                    }
                    : null,

                factura: facturaTexto ? {
                    numero: facturaTexto.match(
                        /FACTURA ELECTRÓNICA DE VENTA No\.\s*([^\r\n]+)/i
                    )?.[1]?.trim() ?? "",

                    fecha: facturaTexto.match(
                        /Fecha de emisión:\s*(\d{4}-\d{2}-\d{2})/i
                    )?.[1] ?? "",

                    total: extraerMonto(
                        facturaTexto.match(
                            /^TOTAL:\s*([^\r\n]+)/im
                        )?.[1] ?? ""
                    )
                }
                    : null

            };

            return JSON.stringify({
                ok: true,
                data: paquete,
                faltantes: [
                    ...(!cotizacionTexto ? ["cotizacion.txt"] : []),
                    ...(!aprobacionTexto ? ["aprobacion.json"] : [])
                ]
            });
        } catch (error) {
            return JSON.stringify({
                ok: false,
                error: error instanceof Error
                    ? error.message
                    : "Error desconocido al leer el paquete"
            });
        }
    }
};

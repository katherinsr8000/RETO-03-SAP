
import { leerProveedores } from "./maestros.js";

type ResultadoProveedor = {
    valido: boolean;
    codigo_sap: string | null;
    nombre: string | null;
    nit: string | null;
    motivo: string | null;
};

function normalizarNit(nit: string): string {
    return nit.replace(/\D/g, "");
}

function normalizarNombre(nombre: string): string {
    return nombre
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


export async function validarProveedor(
  directory: string,
  nit: string | null | undefined,
  nombre: string
): Promise<ResultadoProveedor> {
  const proveedores = await leerProveedores(directory);

  const proveedor = nit
    ? proveedores.find(
        (p) => normalizarNit(p.nit) === normalizarNit(nit)
      )
    : proveedores.find(
        (p) => normalizarNombre(p.nombre) === normalizarNombre(nombre)
      );

  if (!proveedor) {
    return {
      valido: false,
      codigo_sap: null,
      nombre: null,
      nit: null,
      motivo: "RC1: El proveedor no existe en el maestro."
    };
  }

  if (!proveedor.activo) {
    return {
      valido: false,
      codigo_sap: proveedor.codigo_sap,
      nombre: proveedor.nombre,
      nit: proveedor.nit,
      motivo: "RC1: El proveedor está inactivo."
    };
  }

  return {
    valido: true,
    codigo_sap: proveedor.codigo_sap,
    nombre: proveedor.nombre,
    nit: proveedor.nit,
    motivo: null
  };
}



export async function validarAprobacion(
    directory: string,
    centroCosto: string,
    aprobacion: {
        de: string;
        aprobado: boolean;
    } | null
): Promise<{
    valido: boolean;
    motivo: string | null;
    tope: number | null;
}> {
    try {
        if (!aprobacion) {
            return {
                valido: false,
                motivo: "RC2: No existe aprobación.",
                tope: null
            };
        }

        if (!aprobacion.aprobado) {
            return {
                valido: false,
                motivo: "RC2: El correo no contiene una aprobación válida.",
                tope: null
            };
        }

        const { readFile } = await import("node:fs/promises");
        const path = await import("node:path");

        const ruta = path.join(
            directory,
            "fixtures",
            "reto-03",
            "maestros",
            "centros-costo.json"
        );

        const contenido = await readFile(ruta, "utf-8");
        const centros: unknown = JSON.parse(contenido);

        const { z } = await import("zod");

        const esquema = z.array(
            z.object({
                centro_costo: z.string(),
                subareas: z.array(z.string()),
                aprobadores: z.array(
                    z.object({
                        email: z.string(),
                        tope: z.number()
                    })
                )
            })
        );

        const datos = esquema.parse(centros);

        const centro = datos.find(
            (c) => c.centro_costo === centroCosto
        );

        if (!centro) {
            return {
                valido: false,
                motivo: "RC2: El centro de costo no existe.",
                tope: null
            };
        }

        const aprobador = centro.aprobadores.find(
            (a) =>
                a.email.toLowerCase() ===
                aprobacion.de.toLowerCase()
        );

        if (!aprobador) {
            return {
                valido: false,
                motivo: "RC2: El aprobador no está autorizado para este centro de costo.",
                tope: null
            };
        }

        return {
            valido: true,
            motivo: null,
            tope: aprobador.tope
        };
    } catch (error) {
        return {
            valido: false,
            motivo:
                error instanceof Error
                    ? `RC2: Error al validar aprobación: ${error.message}`
                    : "RC2: Error desconocido al validar aprobación.",
            tope: null
        };
    }
}

export function validarTopeAprobacion(
    valorTotal: number,
    tope: number | null
): {
    valido: boolean;
    motivo: string | null;
} {
    if (!Number.isFinite(valorTotal) || valorTotal < 0) {
        return {
            valido: false,
            motivo: "RC3: El valor total de la compra es inválido."
        };
    }

    if (tope === null || !Number.isFinite(tope) || tope < 0) {
        return {
            valido: false,
            motivo: "RC3: No existe un tope de aprobación válido."
        };
    }

    if (valorTotal > tope) {
        return {
            valido: false,
            motivo:
                `RC3: El valor de la compra (${valorTotal}) ` +
                `supera el tope autorizado (${tope}).`
        };
    }

    return {
        valido: true,
        motivo: null
    };
}


export async function validarSubarea(
    directory: string,
    centroCosto: string,
    subarea: string
): Promise<{
    valido: boolean;
    motivo: string | null;
}> {
    try {
        const { readFile } = await import("node:fs/promises");
        const path = await import("node:path");
        const { z } = await import("zod");

        const ruta = path.join(
            directory,
            "fixtures",
            "reto-03",
            "maestros",
            "centros-costo.json"
        );

        const contenido = await readFile(ruta, "utf-8");
        const datos: unknown = JSON.parse(contenido);

        const esquema = z.array(
            z.object({
                centro_costo: z.string(),
                subareas: z.array(z.string()),
                aprobadores: z.array(
                    z.object({
                        email: z.string(),
                        tope: z.number()
                    })
                )
            })
        );

        const centros = esquema.parse(datos);

        const centro = centros.find(
            (c) => c.centro_costo === centroCosto
        );

        if (!centro) {
            return {
                valido: false,
                motivo: "RC4: El centro de costo no existe."
            };
        }

        const subareaValida = centro.subareas.some(
            (s) =>
                s.trim().toLowerCase() ===
                subarea.trim().toLowerCase()
        );

        if (!subareaValida) {
            return {
                valido: false,
                motivo:
                    `RC4: La subárea '${subarea}' no pertenece ` +
                    `al centro de costo '${centroCosto}'.`
            };
        }

        return {
            valido: true,
            motivo: null
        };
    } catch (error) {
        return {
            valido: false,
            motivo: error instanceof Error
                ? `RC4: Error al validar subárea: ${error.message}`
                : "RC4: Error desconocido."
        };
    }
}


export function validarCotizacion(
    valorSolicitud: number,
    valorCotizacion: number | null
): {
    valido: boolean;
    requiereConfirmacion: boolean;
    motivo: string | null;
    diferenciaPorcentaje: number | null;
} {
    if (
        !Number.isFinite(valorSolicitud) ||
        valorSolicitud <= 0
    ) {
        return {
            valido: false,
            requiereConfirmacion: false,
            motivo: "RC5: El valor de la solicitud es inválido.",
            diferenciaPorcentaje: null
        };
    }

    if (valorCotizacion === null) {
        return {
            valido: true,
            requiereConfirmacion: true,
            motivo: "RC5: No existe cotización. Se requiere confirmación.",
            diferenciaPorcentaje: null
        };
    }

    if (
        !Number.isFinite(valorCotizacion) ||
        valorCotizacion < 0
    ) {
        return {
            valido: false,
            requiereConfirmacion: false,
            motivo: "RC5: El valor de la cotización es inválido.",
            diferenciaPorcentaje: null
        };
    }

    const diferenciaPorcentaje =
        (Math.abs(valorCotizacion - valorSolicitud) /
            valorSolicitud) * 100;

    if (diferenciaPorcentaje > 2) {
        return {
            valido: true,
            requiereConfirmacion: true,
            motivo:
                `RC5: La solicitud tiene un valor de ${valorSolicitud} ` +
                `y la cotización de ${valorCotizacion}. ` +
                `La diferencia es ${diferenciaPorcentaje.toFixed(2)}%. ` +
                "Se requiere confirmación humana.",
            diferenciaPorcentaje
        };
    }

    return {
        valido: true,
        requiereConfirmacion: false,
        motivo: null,
        diferenciaPorcentaje
    };
}


export async function validarIVA(
    directory: string,
    indicadorIVA: string | null | undefined,
    proveedorNit: string
): Promise<{
    valido: boolean;
    requiereConfirmacion: boolean;
    indicadorIVA: string | null;
    motivo: string | null;
}> {
    try {
        const proveedores = await leerProveedores(directory);
        const nitNormalizado = proveedorNit?.replace(/\D/g, "");

        const proveedor = nitNormalizado
            ? proveedores.find(
                (p) => p.nit.replace(/\D/g, "") === nitNormalizado
            )
            : undefined;

        if (!proveedor || !proveedor.activo) {
            return {
                valido: false,
                requiereConfirmacion: false,
                indicadorIVA: null,
                motivo: "RC6: No se encontró un proveedor activo."
            };
        }

        const { readFile } = await import("node:fs/promises");
        const path = await import("node:path");
        const { z } = await import("zod");

        const ruta = path.join(
            directory,
            "fixtures",
            "reto-03",
            "maestros",
            "indicadores-iva.json"
        );

        const contenido = await readFile(ruta, "utf-8");
        const datos: unknown = JSON.parse(contenido);

        const indicadores = z.array(
            z.object({
                codigo: z.string(),
                descripcion: z.string(),
                tasa: z.number()
            })
        ).parse(datos);

        const codigo = indicadorIVA?.trim() ||
            proveedor.indicador_iva_default;

        const existe = indicadores.some(
            (i) => i.codigo === codigo
        );

        if (!existe) {
            return {
                valido: false,
                requiereConfirmacion: false,
                indicadorIVA: null,
                motivo: `RC6: El indicador IVA '${codigo}' no existe.`
            };
        }

        const derivado = !indicadorIVA?.trim();

        return {
            valido: true,
            requiereConfirmacion: derivado,
            indicadorIVA: codigo,
            motivo: derivado
                ? `RC6: Se derivó el indicador IVA '${codigo}' del proveedor. Se requiere confirmación.`
                : null
        };
    } catch (error) {
        return {
            valido: false,
            requiereConfirmacion: false,
            indicadorIVA: null,
            motivo: error instanceof Error
                ? `RC6: ${error.message}`
                : "RC6: Error desconocido."
        };
    }
}


export async function validarCondicionesPago(
    directory: string,
    condicionesPago: string | null | undefined,
    proveedorNit: string
): Promise<{
    valido: boolean;
    condicionesPago: string | null;
    derivado: boolean;
    motivo: string | null;
}> {
    try {
        const proveedores = await leerProveedores(directory);
        const nitNormalizado = proveedorNit?.replace(/\D/g, "");

        const proveedor = nitNormalizado
            ? proveedores.find(
                (p) => p.nit.replace(/\D/g, "") === nitNormalizado
            )
            : undefined;

        if (!proveedor || !proveedor.activo) {
            return {
                valido: false,
                condicionesPago: null,
                derivado: false,
                motivo: "RC7: No se encontró un proveedor activo."
            };
        }

        const { readFile } = await import("node:fs/promises");
        const path = await import("node:path");
        const { z } = await import("zod");

        const ruta = path.join(
            directory,
            "fixtures",
            "reto-03",
            "maestros",
            "condiciones-pago.json"
        );

        const contenido = await readFile(ruta, "utf-8");
        const datos: unknown = JSON.parse(contenido);

        const condiciones = z.array(
            z.object({
                codigo: z.string(),
                descripcion: z.string(),
                dias: z.number()
            })
        ).parse(datos);

        const derivado = !condicionesPago?.trim();

        const codigo = derivado
            ? proveedor.condiciones_pago_default
            : condicionesPago!.trim();

        const existe = condiciones.some(
            (c) => c.codigo === codigo
        );

        if (!existe) {
            return {
                valido: false,
                condicionesPago: null,
                derivado: false,
                motivo: `RC7: La condición de pago '${codigo}' no existe.`
            };
        }

        return {
            valido: true,
            condicionesPago: codigo,
            derivado,
            motivo: derivado
                ? `RC7: Se derivó la condición de pago '${codigo}' del proveedor.`
                : null
        };
    } catch (error) {
        return {
            valido: false,
            condicionesPago: null,
            derivado: false,
            motivo: error instanceof Error
                ? `RC7: ${error.message}`
                : "RC7: Error desconocido."
        };
    }
}


export function validarRetroactividad(
    fechaSolicitud: string,
    fechaFactura: string | null
): {
    retroactiva: boolean;
    requiereConfirmacion: boolean;
    motivo: string | null;
} {
    if (!fechaFactura) {
        return {
            retroactiva: false,
            requiereConfirmacion: false,
            motivo: null
        };
    }

    const solicitud = new Date(fechaSolicitud);
    const factura = new Date(fechaFactura);

    if (
        Number.isNaN(solicitud.getTime()) ||
        Number.isNaN(factura.getTime())
    ) {
        return {
            retroactiva: false,
            requiereConfirmacion: true,
            motivo: "RC8: No se pudo validar la fecha de la factura o solicitud."
        };
    }

    if (factura < solicitud) {
        return {
            retroactiva: true,
            requiereConfirmacion: true,
            motivo:
                `RC8: La factura tiene fecha ${fechaFactura}, ` +
                `anterior a la solicitud ${fechaSolicitud}. ` +
                "La orden es retroactiva y requiere confirmación."
        };
    }

    return {
        retroactiva: false,
        requiereConfirmacion: false,
        motivo: null
    };
}


export function validarFechaAprobacion(
    fechaSolicitud: string,
    fechaAprobacion: string | null
): {
    valido: boolean;
    requiereConfirmacion: boolean;
    motivo: string | null;
} {
    if (!fechaAprobacion) {
        return {
            valido: false,
            requiereConfirmacion: false,
            motivo: "RC9: No existe fecha de aprobación."
        };
    }

    const solicitud = new Date(fechaSolicitud);
    const aprobacion = new Date(fechaAprobacion);

    if (
        Number.isNaN(solicitud.getTime()) ||
        Number.isNaN(aprobacion.getTime())
    ) {
        return {
            valido: false,
            requiereConfirmacion: false,
            motivo: "RC9: Las fechas no tienen un formato válido."
        };
    }

    // Comparamos la fecha calendario, sin considerar la hora.
    const fechaSolicitudDia = fechaSolicitud.slice(0, 10);
    const fechaAprobacionDia = fechaAprobacion.slice(0, 10);

    if (fechaAprobacionDia < fechaSolicitudDia) {
        return {
            valido: true,
            requiereConfirmacion: true,
            motivo:
                `RC9: La aprobación (${fechaAprobacionDia}) ` +
                `es anterior a la solicitud (${fechaSolicitudDia}). ` +
                "Se requiere confirmación humana."
        };
    }

    return {
        valido: true,
        requiereConfirmacion: false,
        motivo: null
    };
}


export function validarCalculoTotal(
    cantidad: number,
    valorUnitario: number,
    valorTotal: number
): {
    valido: boolean;
    totalCalculado: number | null;
    diferencia: number | null;
    motivo: string | null;
} {
    if (
        !Number.isFinite(cantidad) ||
        !Number.isFinite(valorUnitario) ||
        !Number.isFinite(valorTotal) ||
        cantidad <= 0 ||
        valorUnitario < 0 ||
        valorTotal < 0
    ) {
        return {
            valido: false,
            totalCalculado: null,
            diferencia: null,
            motivo: "RC10: Los valores de la compra son inválidos."
        };
    }

    const totalCalculado = cantidad * valorUnitario;
    const diferencia = Math.abs(totalCalculado - valorTotal);

    if (!Number.isFinite(totalCalculado) || diferencia > 1) {
        return {
            valido: false,
            totalCalculado,
            diferencia,
            motivo:
                `RC10: El total calculado (${totalCalculado}) ` +
                `no coincide con el valor informado (${valorTotal}). ` +
                `Diferencia: ${diferencia}.`
        };
    }

    return {
        valido: true,
        totalCalculado,
        diferencia,
        motivo: null
    };
}

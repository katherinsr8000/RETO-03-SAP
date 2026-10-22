
import type { ResultadoValidacion } from "./tipos.js";


import {
    validarProveedor,
    validarAprobacion,
    validarTopeAprobacion,
    validarSubarea,
    validarCotizacion,
    validarIVA,
    validarCondicionesPago,
    validarRetroactividad,
    validarFechaAprobacion,
    validarCalculoTotal
} from "./validaciones.js";


export function crearResultadoValidacion(): ResultadoValidacion {
    return {
        apta: false,
        bloqueos: [],
        confirmaciones: [],
        derivados: {},
        retroactiva: false
    };
}

export function finalizarValidacion(
    resultado: ResultadoValidacion
): ResultadoValidacion {
    resultado.apta =
        resultado.bloqueos.length === 0 &&
        resultado.confirmaciones.length === 0;

    return resultado;
}


export async function validarOrden(
    directory: string,

    solicitud: {
        proveedor_nit: string;
        proveedor_nombre: string;
        centro_costo: string;
        subarea: string;
        cantidad: number;
        valor_unitario: number;
        valor_total: number;
        indicador_iva?: string | null;
        condiciones_pago?: string | null;
        fecha_solicitud: string;
    },
    aprobacion: {
        de: string;
        aprobado: boolean;
        fecha: string;
    } | null,
    cotizacion: {
        total: number;
    } | null,
    factura: {
        fecha: string;
    } | null
): Promise<ResultadoValidacion> {

    const resultado = crearResultadoValidacion();

    // RC1: Verificar proveedor existente y activo.
    const proveedor = await validarProveedor(
        directory,
        solicitud.proveedor_nit,
        solicitud.proveedor_nombre
    );

    if (!proveedor.valido) {
        resultado.bloqueos.push(
            proveedor.motivo ?? "RC1: Proveedor inválido."
        );
    } else if (proveedor.codigo_sap) {
        resultado.derivados.codigo_sap = proveedor.codigo_sap;
    }

    // RC2: Verificar que la aprobación sea válida.
    const aprobador = await validarAprobacion(
        directory,
        solicitud.centro_costo,
        aprobacion
    );

    if (!aprobador.valido) {
        resultado.bloqueos.push(
            aprobador.motivo ?? "RC2: Aprobación inválida."
        );
    }

    // RC3: Comprobar el tope del aprobador.
    // Solo se ejecuta si RC2 encontró un aprobador autorizado.
    if (aprobador.valido) {
        const tope = validarTopeAprobacion(
            solicitud.valor_total,
            aprobador.tope
        );

        if (!tope.valido) {
            resultado.bloqueos.push(
                tope.motivo ?? "RC3: Tope de aprobación superado."
            );
        }
    }


    // RC4: Validar la subárea.
    const subarea = await validarSubarea(
        directory,
        solicitud.centro_costo,
        solicitud.subarea
    );

    if (!subarea.valido) {
        resultado.bloqueos.push(
            subarea.motivo ?? "RC4: Subárea inválida."
        );
    }

    // RC5: Comparar solicitud y cotización.
    const comparacion = validarCotizacion(
        solicitud.valor_total,
        cotizacion?.total ?? null
    );

    if (!comparacion.valido) {
        resultado.bloqueos.push(
            comparacion.motivo ?? "RC5: Cotización inválida."
        );
    } else if (comparacion.requiereConfirmacion) {
        resultado.confirmaciones.push(
            comparacion.motivo ?? "RC5: Confirmar cotización."
        );
    }

    // RC6: Validar indicador IVA.
    const iva = await validarIVA(
        directory,
        solicitud.indicador_iva,
        proveedor.valido
            ? proveedor.nit ?? solicitud.proveedor_nit ?? ""
            : solicitud.proveedor_nit ?? ""
    );

    if (!iva.valido) {
        resultado.bloqueos.push(
            iva.motivo ?? "RC6: IVA inválido."
        );
    } else {
        if (iva.indicadorIVA) {
            resultado.derivados.indicador_iva = iva.indicadorIVA;
        }

        if (iva.requiereConfirmacion) {
            resultado.confirmaciones.push(
                iva.motivo ?? "RC6: Confirmar indicador IVA."
            );
        }
    }


    // RC7: Validar condiciones de pago.
    const pago = await validarCondicionesPago(
        directory,
        solicitud.condiciones_pago,
        proveedor.valido
            ? proveedor.nit ?? solicitud.proveedor_nit ?? ""
            : solicitud.proveedor_nit ?? ""
    );

    if (!pago.valido) {
        resultado.bloqueos.push(
            pago.motivo ?? "RC7: Condiciones de pago inválidas."
        );
    } else if (pago.condicionesPago) {
        resultado.derivados.condiciones_pago = pago.condicionesPago;
    }

    // RC8: Detectar compras retroactivas.
    const retroactividad = validarRetroactividad(
        solicitud.fecha_solicitud,
        factura?.fecha ?? null
    );

    resultado.retroactiva = retroactividad.retroactiva;

    if (retroactividad.requiereConfirmacion) {
        resultado.confirmaciones.push(
            retroactividad.motivo ?? "RC8: Revisar retroactividad."
        );
    }

    // RC9: Validar fecha de aprobación.
    const fechaAprobacion = validarFechaAprobacion(
        solicitud.fecha_solicitud,
        aprobacion?.fecha ?? null
    );

    if (!fechaAprobacion.valido) {
        resultado.bloqueos.push(
            fechaAprobacion.motivo ?? "RC9: Fecha inválida."
        );
    } else if (fechaAprobacion.requiereConfirmacion) {
        resultado.confirmaciones.push(
            fechaAprobacion.motivo ?? "RC9: Confirmar fecha."
        );
    }


    // RC10: Validar cantidad × valor unitario = valor total.
    const calculo = validarCalculoTotal(
        solicitud.cantidad,
        solicitud.valor_unitario,
        solicitud.valor_total
    );

    if (!calculo.valido) {
        resultado.bloqueos.push(
            calculo.motivo ?? "RC10: El cálculo total es inválido."
        );
    }

    return finalizarValidacion(resultado);
}

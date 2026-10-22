
import { consultarSolicitud } from "./herramientas.js";
import { prepararDatosSAP } from "../sap/preparar-orden.js";
import { procesarOrden } from "../sap/procesar-orden.js";
import { registrarEvento } from "../auditoria/registro.js";

// Confirmaciones humanas simuladas durante la ejecución.
const confirmacionesHumanas = new Set<string>();

type Mensaje = {
    role: "user" | "assistant";
    content: string;
};

export async function conversar(
    mensaje: string,
    historial: Mensaje[] = []
): Promise<string> {
    const texto = mensaje.toLowerCase().trim();

    // Buscar el identificador de la solicitud.
    const coincidencia = texto.match(/sol[-\s]?00[1-6]\b/);

    // Recuperar la solicitud desde el historial si es necesario.
    const contexto = [...historial].reverse().find(
        (item) =>
            item.role === "user" &&
            /sol[-\s]?00[1-6]\b/i.test(item.content)
    );

    const casoEncontrado =
        coincidencia?.[0] ??
        contexto?.content.toLowerCase().match(
            /sol[-\s]?00[1-6]\b/
        )?.[0];

    if (!casoEncontrado) {
        return (
            "¡Hola! Soy el asistente de compras SAP en modo demostración.\n\n" +
            "Puedo revisar solicitudes desde sol-001 hasta sol-006.\n\n" +
            "Ejemplo: Revisa la solicitud sol-001."
        );
    }

    const caso = casoEncontrado.replace(" ", "-");
    const directory = process.cwd();

    try {
        const consulta = await consultarSolicitud(
            directory,
            caso
        );

        if (
            !consulta.ok ||
            !consulta.validacion ||
            !consulta.solicitud
        ) {
            return `No fue posible consultar ${caso}.`;
        }

        const { solicitud, validacion } = consulta;

        // Registrar consulta.
        registrarEvento(
            solicitud.solicitud_id,
            "CONSULTA",
            `Consulta de ${caso}`
        );

        // Detectar confirmación explícita del usuario.
        const confirma =
            /\b(confirmo|confirmar|acepto|autorizo)\b/.test(texto);

        if (confirma) {
            if (validacion.bloqueos.length > 0) {
                registrarEvento(
                    solicitud.solicitud_id,
                    "BLOQUEO",
                    validacion.bloqueos.join("; ")
                );

                return (
                    `No puedo confirmar ${caso} porque tiene bloqueos:\n\n` +
                    validacion.bloqueos.join("\n")
                );
            }

            if (validacion.confirmaciones.length === 0) {
                return `La solicitud ${caso} no requiere confirmación humana.`;
            }

            // Registrar confirmación de demostración.
            confirmacionesHumanas.add(solicitud.solicitud_id);

            registrarEvento(
                solicitud.solicitud_id,
                "CONFIRMACION",
                `Confirmación de demostración recibida: ${validacion.confirmaciones.join("; ")}`
            );

            return (
                `Confirmación registrada para ${caso}.\n\n` +
                `Motivos:\n${validacion.confirmaciones.join("\n")}\n\n` +
                `Ahora puedes escribir: Crear orden para ${caso}.`
            );
        }

        // Detectar intención de crear una orden.
        const quiereCrear =
            /\b(crear|crea|generar|genera|registrar|registra)\b/.test(
                texto
            );

        if (quiereCrear) {
            const confirmacionRegistrada =
                confirmacionesHumanas.has(solicitud.solicitud_id);

            // Impedir creación cuando existan bloqueos
            // o confirmaciones pendientes.
            if (
                validacion.bloqueos.length > 0 ||
                (validacion.confirmaciones.length > 0 &&
                    !confirmacionRegistrada)
            ) {
                const motivos = [
                    ...validacion.bloqueos,
                    ...(confirmacionRegistrada
                        ? []
                        : validacion.confirmaciones)
                ];

                registrarEvento(
                    solicitud.solicitud_id,
                    "BLOQUEO",
                    motivos.join("; ")
                );

                return (
                    `No puedo crear la orden de ${caso}.\n\n` +
                    motivos.join("\n") +
                    "\n\nLa orden no fue creada."
                );
            }

            const datos = prepararDatosSAP(
                solicitud,
                validacion
            );

            if (!datos) {
                registrarEvento(
                    solicitud.solicitud_id,
                    "ERROR",
                    "Faltan datos obligatorios para SAP."
                );

                return "Faltan datos obligatorios para SAP.";
            }

            const resultado = procesarOrden(
                validacion,
                datos,
                confirmacionRegistrada
            );

            if (!resultado.creada) {
                registrarEvento(
                    solicitud.solicitud_id,
                    "BLOQUEO",
                    resultado.mensaje
                );

                return resultado.mensaje;
            }

            // Registrar la orden SAP simulada.
            registrarEvento(
                solicitud.solicitud_id,
                "ORDEN_CREADA",
                `Orden simulada: ${resultado.orden.numero_orden}`
            );

            return (
                "¡Orden SAP simulada creada correctamente!\n\n" +
                `Número: ${resultado.orden.numero_orden}\n` +
                `Solicitud: ${resultado.orden.solicitud_id}\n` +
                `Proveedor SAP: ${resultado.orden.proveedor_codigo_sap}\n` +
                `Valor: ${resultado.orden.valor_total.toLocaleString("es-CO")} COP\n` +
                `Estado: ${resultado.orden.estado}\n\n` +
                "Esta operación es una simulación; no se registró en SAP real."
            );
        }

        const bloqueos = validacion.bloqueos.length
            ? validacion.bloqueos.join("\n")
            : "Ninguno.";

        const confirmaciones =
            validacion.confirmaciones.length
                ? validacion.confirmaciones.join("\n")
                : "Ninguna.";

        return (
            `Resultado de la solicitud ${caso}\n\n` +
            `ID: ${solicitud.solicitud_id}\n` +
            `Descripción: ${solicitud.descripcion}\n` +
            `Proveedor: ${solicitud.proveedor_nombre}\n` +
            `Valor: ${solicitud.valor_total.toLocaleString("es-CO")} COP\n\n` +
            `Estado: ${
                validacion.apta
                    ? "APTA PARA CREACIÓN"
                    : validacion.bloqueos.length
                        ? "BLOQUEADA"
                        : "PENDIENTE DE CONFIRMACIÓN"
            }\n\n` +
            `Bloqueos:\n${bloqueos}\n\n` +
            `Confirmaciones pendientes:\n${confirmaciones}\n\n` +
            (validacion.apta
                ? `Puedes escribir: Crear orden para ${caso}.`
                : "No se puede crear la orden hasta resolver los pendientes.")
        );
    } catch (error) {
        console.error("Error en modo demostración:", error);

        return "Ocurrió un error al procesar la solicitud.";
    }
}

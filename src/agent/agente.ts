
import { consultarSolicitud } from "./herramientas.js";
import { prepararDatosSAP } from "../sap/preparar-orden.js";
import { procesarOrden } from "../sap/procesar-orden.js";

type Mensaje = {
  role: "user" | "assistant";
  content: string;
};

export async function conversar(
  mensaje: string,
  historial: Mensaje[] = []
): Promise<string> {
  const texto = mensaje.toLowerCase().trim();

  // Buscar el identificador en el mensaje actual
  const coincidencia = texto.match(/sol[-\s]?00[1-6]\b/);

  // Si el usuario continúa la conversación sin repetir
  // el identificador, buscarlo en mensajes anteriores.
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

    // Detectar si el usuario quiere crear una orden.
    const quiereCrear =
      /\b(crear|crea|generar|genera|registrar|registra)\b/.test(
        texto
      );

    if (quiereCrear) {
      if (!validacion.apta) {
        return (
          `No puedo crear la orden de ${caso}.\n\n` +
          [
            ...validacion.bloqueos,
            ...validacion.confirmaciones
          ].join("\n") +
          "\n\nLa orden no fue creada."
        );
      }

      const datos = prepararDatosSAP(
        solicitud,
        validacion
      );

      if (!datos) {
        return "Faltan datos obligatorios para SAP.";
      }

      const resultado = procesarOrden(
        validacion,
        datos
      );

      if (!resultado.creada) {
        return resultado.mensaje;
      }

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

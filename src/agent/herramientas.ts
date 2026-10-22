
import { leer_paquete } from "../tools/oc.js";
import { validarOrden } from "../tools/oc-validar.js";

export async function consultarSolicitud(
  directory: string,
  caso: string
) {
  const respuesta = await leer_paquete.execute(
    { caso },
    {
      directory,
      sessionId: `agente-${caso}`
    }
  );

  const paquete = JSON.parse(respuesta);

  if (!paquete.ok) {
    return {
      ok: false,
      caso,
      error: paquete.error
    };
  }

  const validacion = await validarOrden(
    directory,
    paquete.data.solicitud,
    paquete.data.aprobacion,
    paquete.data.cotizacion,
    paquete.data.factura
  );

  return {
    ok: true,
    caso,
    solicitud: paquete.data.solicitud,
    validacion
  };
}

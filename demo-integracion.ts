
import { leer_paquete } from "./src/tools/oc.js";
import { validarOrden } from "./src/tools/oc-validar.js";
import { prepararDatosSAP } from "./src/sap/preparar-orden.js";
import { procesarOrden } from "./src/sap/procesar-orden.js";

async function main(): Promise<void> {
  const directory = process.cwd();

  const casos = [
    "sol-001",
    "sol-002",
    "sol-003",
    "sol-004",
    "sol-005",
    "sol-006"
  ];

  for (const caso of casos) {
    console.log(`\n========== ${caso} ==========`);

    try {
      // 1. Leer los documentos de la solicitud
      const respuesta = await leer_paquete.execute(
        { caso },
        {
          directory,
          sessionId: `integracion-${caso}`
        }
      );

      const paquete = JSON.parse(respuesta);

      if (!paquete.ok) {
        console.log("ERROR DE LECTURA:", paquete.error);
        continue;
      }

      // 2. Ejecutar las reglas RC1-RC10
      const validacion = await validarOrden(
        directory,
        paquete.data.solicitud,
        paquete.data.aprobacion,
        paquete.data.cotizacion,
        paquete.data.factura
      );

      console.log("APTA:", validacion.apta);
      console.log("BLOQUEOS:", validacion.bloqueos);
      console.log(
        "CONFIRMACIONES:",
        validacion.confirmaciones
      );

      // 3. Detener solicitudes no autorizadas
      if (!validacion.apta) {
        console.log("ORDEN CREADA: NO");
        console.log(
          "MOTIVO:",
          validacion.bloqueos.length > 0
            ? "La solicitud tiene bloqueos."
            : "La solicitud necesita confirmación humana."
        );
        continue;
      }

      // 4. Preparar los datos para SAP
      const datosSAP = prepararDatosSAP(
        paquete.data.solicitud,
        validacion
      );

      if (!datosSAP) {
        console.log("ORDEN CREADA: NO");
        console.log(
          "MOTIVO: Faltan datos obligatorios para SAP."
        );
        continue;
      }

      // 5. Crear la orden SAP simulada
      const resultado = procesarOrden(
        validacion,
        datosSAP
      );

      console.log("ORDEN CREADA:", resultado.creada);

      if (resultado.creada) {
        console.log(
          "NÚMERO SAP:",
          resultado.orden.numero_orden
        );

        console.log(
          "ORDEN COMPLETA:",
          JSON.stringify(resultado.orden, null, 2)
        );
      } else {
        console.log("MOTIVO:", resultado.mensaje);
      }

    } catch (error) {
      console.error(
        "ERROR:",
        error instanceof Error
          ? error.message
          : String(error)
      );

      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

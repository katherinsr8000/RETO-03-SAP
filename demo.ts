
import { leer_paquete } from "./src/tools/oc.js";
import { validarOrden } from "./src/tools/oc-validar.js";

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
      const respuesta = await leer_paquete.execute(
        { caso },
        {
          directory,
          sessionId: `demo-${caso}`
        }
      );

      const paquete = JSON.parse(respuesta);

      if (!paquete.ok) {
        console.log("ERROR DE LECTURA:", paquete.error);
        continue;
      }

      const resultado = await validarOrden(
        directory,
        paquete.data.solicitud,
        paquete.data.aprobacion,
        paquete.data.cotizacion,
        paquete.data.factura
      );

      console.log("APTA:", resultado.apta);
      console.log("BLOQUEOS:", resultado.bloqueos);
      console.log("CONFIRMACIONES:", resultado.confirmaciones);
      console.log("DERIVADOS:", resultado.derivados);
      console.log("RETROACTIVA:", resultado.retroactiva);

    } catch (error) {
      console.error(
        "ERROR:",
        error instanceof Error ? error.message : String(error)
      );
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

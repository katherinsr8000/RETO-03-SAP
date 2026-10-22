
import { readFile } from "node:fs/promises";
import path from "node:path";

async function probarLectura(): Promise<void> {
  try {
    const ruta = path.join(
      process.cwd(),
      "fixtures",
      "reto-03",
      "solicitudes",
      "sol-001",
      "solicitud.json"
    );

    const contenido = await readFile(ruta, "utf-8");
    const solicitud: unknown = JSON.parse(contenido);

    console.log("Solicitud encontrada correctamente:");
    console.log(JSON.stringify(solicitud, null, 2));
  } catch (error) {
    console.error(
      "Error al leer la solicitud:",
      error instanceof Error ? error.message : String(error)
    );
    process.exitCode = 1;
  }
}

void probarLectura();

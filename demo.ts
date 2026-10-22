
import { leer_paquete } from "./src/tools/oc.js";
import { validarOrden } from "./src/tools/oc-validar.js";
import { consultarSolicitud } from "./src/agent/herramientas.js";
import { prepararDatosSAP } from "./src/sap/preparar-orden.js";
import { procesarOrden } from "./src/sap/procesar-orden.js";

async function main(): Promise<void> {
    const directory = process.cwd();

    // PRUEBA 1: VALIDAR LOS SEIS CASOS
    const casos = [
        "sol-001",
        "sol-002",
        "sol-003",
        "sol-004",
        "sol-005",
        "sol-006"
    ];

    console.log("\n==================================");
    console.log(" DEMOSTRACION AGENTE DE COMPRAS SAP");
    console.log("==================================");

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
                process.exitCode = 1;
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
                error instanceof Error
                    ? error.message
                    : String(error)
            );
            process.exitCode = 1;
        }
    }

    // PRUEBA 2: IDEMPOTENCIA
    console.log("\n========== PRUEBA DE IDEMPOTENCIA ==========");

    const consulta001 = await consultarSolicitud(
        directory,
        "sol-001"
    );

    if (
        !consulta001.ok ||
        !consulta001.solicitud ||
        !consulta001.validacion
    ) {
        throw new Error("No se pudo consultar sol-001");
    }

    const datos001 = prepararDatosSAP(
        consulta001.solicitud,
        consulta001.validacion
    );

    if (!datos001) {
        throw new Error(
            "No se pudieron preparar los datos de sol-001"
        );
    }

    const primeraOrden = procesarOrden(
        consulta001.validacion,
        datos001
    );

    const segundaOrden = procesarOrden(
        consulta001.validacion,
        datos001
    );

    if (!primeraOrden.creada || !segundaOrden.creada) {
        throw new Error(
            "No se pudieron procesar las órdenes de sol-001"
        );
    }

    const mismoNumero =
        primeraOrden.orden.numero_orden ===
        segundaOrden.orden.numero_orden;

    console.log(
        "Primera orden:",
        primeraOrden.orden.numero_orden
    );

    console.log(
        "Segunda orden:",
        segundaOrden.orden.numero_orden
    );

    console.log(
        "IDEMPOTENCIA:",
        mismoNumero ? "OK" : "ERROR"
    );

    if (!mismoNumero) {
        process.exitCode = 1;
    }

    // PRUEBA 3: CONFIRMACION HUMANA SIMULADA
    console.log("\n========== PRUEBA DE CONFIRMACION ==========");

    const consulta004 = await consultarSolicitud(
        directory,
        "sol-004"
    );

    if (
        !consulta004.ok ||
        !consulta004.solicitud ||
        !consulta004.validacion
    ) {
        throw new Error("No se pudo consultar sol-004");
    }

    const datos004 = prepararDatosSAP(
        consulta004.solicitud,
        consulta004.validacion
    );

    if (!datos004) {
        throw new Error(
            "No se pudieron preparar los datos de sol-004"
        );
    }

    const sinConfirmar = procesarOrden(
        consulta004.validacion,
        datos004,
        false
    );

    console.log(
        "Sin confirmación:",
        sinConfirmar.creada
            ? "ERROR"
            : "BLOQUEADA CORRECTAMENTE"
    );

    const conConfirmacion = procesarOrden(
        consulta004.validacion,
        datos004,
        true
    );

    console.log(
        "Con confirmación:",
        conConfirmacion.creada
            ? "ORDEN CREADA"
            : "ERROR"
    );

    if (conConfirmacion.creada) {
        console.log(
            "Número SAP:",
            conConfirmacion.orden.numero_orden
        );
    }

    if (sinConfirmar.creada || !conConfirmacion.creada) {
        process.exitCode = 1;
    }

    console.log("\n==================================");
    console.log(
        process.exitCode === 1
            ? "DEMOSTRACION FINALIZADA CON ERRORES"
            : "DEMOSTRACION FINALIZADA CORRECTAMENTE"
    );
    console.log("==================================");
}

main().catch((error) => {
    console.error("ERROR GENERAL:", error);
    process.exitCode = 1;
});

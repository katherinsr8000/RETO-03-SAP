
import "dotenv/config";
import express from "express";
import cors from "cors";
import { conversar } from "./agent/agente";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, servicio: "Agente SAP" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { mensaje, historial } = req.body;

    if (typeof mensaje !== "string" || !mensaje.trim()) {
      res.status(400).json({
        error: "Debes escribir un mensaje."
      });
      return;
    }

    const respuesta = await conversar(
      mensaje,
      Array.isArray(historial) ? historial : []
    );

    res.json({ respuesta });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "No fue posible procesar el mensaje."
    });
  }
});

app.use(express.static("web"));

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(
    `Agente SAP disponible en http://localhost:${port}`
  );
});

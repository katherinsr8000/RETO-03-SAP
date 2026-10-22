

export type ResultadoValidacion = {
  apta: boolean;
  bloqueos: string[];
  confirmaciones: string[];
  derivados: {
    codigo_sap?: string;
    indicador_iva?: string;
    condiciones_pago?: string;
  };
  retroactiva: boolean;
};

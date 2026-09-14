import { useState, useEffect } from "react";
import { PlantillaResueltaResponse } from "@/types/historiaClinica.types";

interface UsePlantillaAtencionResult {
  plantilla: PlantillaResueltaResponse | null;
  loading: boolean;
  error: string | null;
}

export function usePlantillaAtencion(citaId: string): UsePlantillaAtencionResult {
  const [plantilla, setPlantilla] = useState<PlantillaResueltaResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!citaId) return;

    const fetchPlantilla = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken") || "";
        const response = await fetch(`/api/v1/clinical-record/citas/${citaId}/plantilla`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error al cargar plantilla: ${response.statusText}`);
        }

        const data: PlantillaResueltaResponse = await response.json();
        setPlantilla(data);
      } catch (err: any) {
        setError(err.message || "Error inesperado de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchPlantilla();
  }, [citaId]);

  return { plantilla, loading, error };
}
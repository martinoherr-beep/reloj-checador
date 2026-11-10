// Reemplaza estas coordenadas con la ubicación exacta de tu oficina
export const OFICINA_COORDS = {
  lat: 26.928436,
  lng: -105.669910
};

// Radio máximo en metros para permitir el registro
export const RADIO_PERMITIDO_METROS = 10;

/**
 * Calcula la distancia en metros entre dos puntos geográficos (Haversine)
 */
export function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distancia en metros
}
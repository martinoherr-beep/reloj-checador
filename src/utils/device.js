// Obtener o crear un identificador único para este navegador/celular
export function getDeviceId() {
  let deviceId = localStorage.getItem('radiorama_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + crypto.randomUUID();
    localStorage.setItem('radiorama_device_id', deviceId);
  }
  return deviceId;
}
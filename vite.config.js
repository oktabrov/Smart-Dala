import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { cameraRelayPlugin } from './dev/camera-relay.mjs';

export default defineConfig(({ command, mode }) => {
  // Unlike VITE_* values, this server-only setting never reaches import.meta.env.
  const environment = command === 'serve'
    ? loadEnv(mode, process.cwd(), 'SMART_DALA_')
    : {};
  const cameraRelayEnabled = Boolean(environment.SMART_DALA_CAMERA_RTSP_URL);

  return {
    plugins: [react(), cameraRelayPlugin({ rtspUrl: environment.SMART_DALA_CAMERA_RTSP_URL })],
    // A boolean is safe to expose; the RTSP URL itself never enters the client bundle.
    define: {
      __SMART_DALA_CAMERA_RELAY_ENABLED__: JSON.stringify(cameraRelayEnabled),
    },
    server: {
      // Bind to every local interface so phones and other trusted LAN devices can open the app.
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
    },
  };
});

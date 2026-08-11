import { spawn } from 'node:child_process';

const CAMERA_PATH = '/camera.mjpg';
const BOUNDARY = 'smartdala';
const MAX_CLIENTS = 8;
const MAX_BUFFERED_BYTES = 1024 * 1024;
const IDLE_STOP_DELAY_MS = 1_500;

function requestPath(requestUrl) {
  try {
    return new URL(requestUrl || '/', 'http://localhost').pathname;
  } catch {
    return '';
  }
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(message);
}

/**
 * Development-only RTSP to MJPEG relay. The RTSP value deliberately stays in
 * Node's server process: it is never added to Vite's client environment or
 * written to the browser.
 */
export function cameraRelayPlugin({ rtspUrl } = {}) {
  const source = String(rtspUrl || '').trim();
  const clients = new Set();
  let relay = null;
  let stopTimer = null;

  const clearStopTimer = () => {
    if (stopTimer) {
      clearTimeout(stopTimer);
      stopTimer = null;
    }
  };

  const stopRelay = () => {
    clearStopTimer();
    const relayProcess = relay;
    relay = null;
    if (relayProcess && !relayProcess.killed) {
      relayProcess.kill();
    }
  };

  const stopWhenIdle = () => {
    if (clients.size || stopTimer) return;
    stopTimer = setTimeout(stopRelay, IDLE_STOP_DELAY_MS);
  };

  const closeClients = () => {
    for (const response of clients) {
      if (!response.writableEnded) response.end();
    }
    clients.clear();
  };

  const broadcast = (chunk) => {
    for (const response of clients) {
      if (response.destroyed || response.writableEnded || response.writableLength > MAX_BUFFERED_BYTES) {
        response.destroy();
        clients.delete(response);
        continue;
      }

      try {
        response.write(chunk);
      } catch {
        response.destroy();
        clients.delete(response);
      }
    }
  };

  const startRelay = () => {
    if (relay || !source) return;

    // `spawn` resolves ffmpeg from PATH without a shell, so the camera URL is
    // never interpolated into or printed as a command string.
    const relayProcess = spawn('ffmpeg', [
      '-nostdin',
      '-hide_banner',
      '-loglevel', 'error',
      '-rtsp_transport', 'tcp',
      '-i', source,
      '-an',
      '-c:v', 'mjpeg',
      // A shared LAN dashboard benefits more from a modest, stable stream
      // than a full-resolution camera feed per browser client.
      '-vf', 'fps=8,scale=1280:-2:force_original_aspect_ratio=decrease',
      '-q:v', '8',
      '-r', '8',
      '-f', 'mpjpeg',
      '-boundary_tag', BOUNDARY,
      'pipe:1',
    ], {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    relay = relayProcess;
    // ffmpeg can report the RTSP target in errors. Consume stderr without
    // logging it so credentials cannot reach the terminal or browser.
    relayProcess.stderr?.resume();
    relayProcess.stdout?.on('data', broadcast);

    const handleEnd = () => {
      // A newly connected client may already have started a replacement
      // process. Do not let an old process close that newer stream.
      if (relay !== relayProcess) return;
      relay = null;
      closeClients();
      stopWhenIdle();
    };

    relayProcess.once('error', handleEnd);
    relayProcess.once('exit', handleEnd);
  };

  return {
    name: 'smart-dala-camera-relay',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (requestPath(request.url) !== CAMERA_PATH) {
          next();
          return;
        }

        if (request.method !== 'GET') {
          response.setHeader('Allow', 'GET');
          sendText(response, 405, 'Method not allowed.');
          return;
        }

        if (!source) {
          sendText(response, 503, 'Camera relay is not configured.');
          return;
        }

        if (clients.size >= MAX_CLIENTS) {
          sendText(response, 503, 'Camera relay is busy.');
          return;
        }

        clearStopTimer();
        response.writeHead(200, {
          'Content-Type': `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          Pragma: 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        response.flushHeaders?.();
        clients.add(response);

        let closed = false;
        const removeClient = () => {
          if (closed) return;
          closed = true;
          clients.delete(response);
          stopWhenIdle();
        };
        request.once('close', removeClient);
        response.once('close', removeClient);

        startRelay();
      });

      server.httpServer?.once('close', () => {
        closeClients();
        stopRelay();
      });
    },
  };
}

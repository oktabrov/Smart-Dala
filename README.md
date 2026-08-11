# Smart Dala

Recovered source for the deployed Smart Dala dashboard. It provides:

- ESP sensor and camera monitoring (user-configured local IP addresses)
- photo-based crop diagnostics
- a browser-local analysis journal
- Uzbek, Russian, and English UI modes

## Run locally

```bash
npm install
npm run dev
```

For the AI function locally, use `npm run dev:netlify` instead. Copy
`.env.example` to `.env` only on your machine, then add a provider key there.

### RTSP camera on a trusted LAN (development only)

Browsers cannot render an `rtsp://` camera address directly. This project uses
the locally installed `ffmpeg` executable to convert a private RTSP feed into
MJPEG at the same origin as the Vite app. Create an ignored `.env.local` file
or set a shell environment variable before starting Vite:

```dotenv
SMART_DALA_CAMERA_RTSP_URL=rtsp://username:password@camera-host:554/path
```

Then run `npm run dev` and open `http://<computer-LAN-IP>:5173` from each
trusted device on the same network. The browser requests `/camera.mjpg`; the
RTSP address and its credentials stay in the server process and are never sent
to the browser. Restart Vite after changing the setting. If the camera panel is
blank, verify `ffmpeg` is available on the computer running Vite and that the
computer can reach the camera. This relay is deliberately development-only and
has no authentication, so do not expose it outside a trusted LAN.

## Deploy to Netlify

Netlify reads `netlify.toml`; use `npm run build` and publish `dist`. In the
Netlify site environment variables, set one or both of these server-side keys:

- `GEMINI_API_KEY` (preferred for image diagnostics)
- `NVIDIA_API_KEY` (used if Gemini is unavailable)

Do not use VITE_ for either key: Vite exposes those values to every browser.
The NVIDIA fallback defaults to the image-capable Llama 3.2 11B Vision endpoint
and can be changed with NVIDIA_MODEL / NVIDIA_ENDPOINT.

The app intentionally keeps analysis history in the browser. Reconnecting an
old Supabase project requires its separate database credentials and schema; no
published credentials were copied into this recovery.

The function validates image type/size, accepts same-origin JSON requests, and
has a lightweight per-instance request limit. Before a public launch, also
enable Netlify's bot/rate-limit protections (or a durable shared limiter) and
add real authentication if records need to be shared across users.

## ESP hardware note

The dashboard polls an ESP endpoint at /api and displays an MJPEG camera stream.
An HTTPS Netlify page cannot reliably call an HTTP-only device because browsers
block mixed content. Use HTTPS on the device, a trusted HTTPS relay on the LAN,
or run the dashboard from an appropriate local development environment.

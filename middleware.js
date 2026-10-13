// Basic auth on /iris only. The portfolio at / stays public, because gordondonnelly.co
// is printed on both resume PDFs and a login wall there would break every recruiter link.
//
// Password lives in the IRIS_PASSWORD env var on Vercel, never in this repo.
// If the var is unset the page is left open rather than locked out, so a misconfigured
// deploy fails visible instead of silently blocking.

export const config = { matcher: ['/iris', '/iris/:path*'] };

export default function middleware(request) {
  const expected = process.env.IRIS_PASSWORD;
  if (!expected) return;

  const header = request.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');

  if (scheme === 'Basic' && encoded) {
    let decoded = '';
    try {
      decoded = atob(encoded);
    } catch {
      decoded = '';
    }
    const sep = decoded.indexOf(':');
    const pass = sep === -1 ? '' : decoded.slice(sep + 1);
    if (pass && safeEqual(pass, expected)) return;
  }

  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Iris Finance", charset="UTF-8"',
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-store',
    },
  });
}

// Constant-time-ish compare so the response time does not leak the password length or prefix.
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

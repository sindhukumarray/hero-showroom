/**
 * HTTP Security Headers Middleware
 * Implements hardened security headers aligned with OWASP recommendations
 * to protect against clickjacking, MIME-sniffing, XSS, and unauthorized framing.
 */
const securityHeaders = (req, res, next) => {
  // 1. Prevent browsers from MIME-sniffing away from the declared content-type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 2. Mitigate clickjacking attacks by disallowing unauthorized framing
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 3. Control referrer information passed in request headers
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 4. Disable legacy buggy XSS auditor in modern browsers
  res.setHeader('X-XSS-Protection', '0');

  // 5. Restrict cross-domain policy files (Flash, PDF, etc.)
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // 6. Disable browser DNS prefetching
  res.setHeader('X-DNS-Prefetch-Control', 'off');

  // 7. Enforce Strict-Transport-Security (HSTS) when on HTTPS or in production
  if (process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 8. Safe Content-Security-Policy for API endpoints
  // Protects against iframe embedding, cross-origin resource leakage, and injection
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'self'; form-action 'self'; object-src 'none'"
  );

  // 9. Ensure Express fingerprint is stripped from response headers
  res.removeHeader('X-Powered-By');

  next();
};

module.exports = securityHeaders;

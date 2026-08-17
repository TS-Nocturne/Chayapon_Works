# Chayapon Works Security Runbook

## Application controls already enabled

- Better Auth sessions with secure cookies in production, exact trusted origins, database-backed rate limiting, stricter password length, and session revocation after password reset.
- Every privileged Server Action performs a server-side role check. Role is not accepted as sign-up input.
- Public database mutations (orders, leads, QR generation, profile updates, and view counts) use database-backed throttling.
- Product images and payment slips accept only bounded JPG, PNG, or WebP data. Remote product images require HTTPS and an explicit hostname allowlist.
- CSP, HSTS in production, clickjacking protection, MIME sniffing protection, restrictive browser permissions, and referrer policy are sent on every route.
- Payment identifiers are server-only and encrypted at rest. Public settings return only display-safe values.

## Required production environment

Set these before deployment:

- `SITE_URL` and `BETTER_AUTH_URL`: the canonical HTTPS production origin.
- `NEXT_PUBLIC_BETTER_AUTH_URL`: the same public HTTPS origin.
- `BETTER_AUTH_TRUSTED_ORIGINS`: exact approved origins only; never include localhost in production.
- `BETTER_AUTH_SECRET`: at least 32 random characters.
- `STORE_SETTINGS_ENCRYPTION_KEY`: a separate long random key. Rotate it only with a data re-encryption plan.
- `RESEND_API_KEY` and `AUTH_EMAIL_FROM`: required for password-reset delivery.
- `IMAGE_REMOTE_HOSTS`: comma-separated image CDN hostnames. Leave empty if images are local/data URLs.
- `SERVER_ACTION_ALLOWED_ORIGINS`: only additional trusted proxy hostnames when the forwarded host differs from the app host.
- `TRUSTED_IP_HEADER`: a header overwritten by the chosen CDN, such as `cf-connecting-ip`. Never trust a client-controlled header at a directly exposed origin.

## DDoS and WAF deployment

Application rate limiting protects expensive mutations and brute-force targets, but cannot absorb a volumetric attack. Put the deployment behind one edge provider:

1. Vercel Firewall, or Cloudflare proxy + WAF + managed DDoS rules.
2. Prevent direct public access to the origin. Allow traffic only from the edge provider or use a private tunnel.
3. Configure `TRUSTED_IP_HEADER` only after the origin is locked to that edge.
4. Start WAF rules in Log/Challenge mode and tune with real traffic before blocking:
   - `/api/auth/*`: challenge repeated requests; the app also enforces endpoint-specific limits.
   - Requests with the `Next-Action` header or repeated POST requests: rate limit per source IP.
   - `/api/*`: rate limit anomalous bursts while allowing normal storefront reads.
5. Enable caching for public static assets and catalog pages where business freshness allows it.
6. Enable provider security alerts and watch HTTP 429, 401/403, 5xx, database connection spikes, and order/lead creation rates.

Do not place Cloudflare in front of another CDN unless the architecture is deliberately designed for it; client-IP attribution and DDoS detection can become less reliable.

## Release checks

Run before every production release:

```bash
npm audit
npm run lint
npm run build
npm run qa:security
npm run qa:catalog
npm run qa:checkout
npm run qa:admin
npm run qa:operations
npm run qa:settings
npm run qa:profile
npm run qa:integrity
npm run qa:routes
```

Also apply migrations with `npx prisma migrate deploy`, verify password-reset email delivery, and confirm that no `.env` file or production secret is committed.

## Incident response basics

1. Enable edge Attack/Challenge mode and preserve logs.
2. Revoke compromised sessions and rotate affected credentials.
3. If payment settings may be exposed, disable checkout and replace payment identifiers.
4. Review `AuditLog`, auth events, order/lead spikes, and deployment history.
5. Patch the root cause, run the full QA suite, then restore traffic gradually.

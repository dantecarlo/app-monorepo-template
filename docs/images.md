# Image protection — cost, hotlink, and scrape posture

A public image like `/img.png` hit 1M times bills the **origin**. Cloudflare
cache egress is free. The protection is two layers:

1. **CODE (this template):** cache at the edge + signed URLs for private images.
2. **DASHBOARD (you configure):** WAF rate-limiting, hotlink protection, and
   Super Bot Fight Mode rules. Documented below — not code.

---

## Layer 1 — Edge caching (CODE)

Image responses get a long immutable `Cache-Control` so Cloudflare's edge
absorbs repeated traffic instead of the Vercel origin.

- Helper: `apps/web/src/lib/image-delivery/imageCacheHeaders.helper.ts`
  returns `public, max-age=31536000, immutable, stale-while-revalidate=86400`.
- Wired in `apps/web/next.config.ts` `headers()` for image extensions
  (`svg|jpg|jpeg|png|webp|avif|gif|ico`).

### Custom cache key that IGNORES query strings (kills cache-busting → cost)

By default Cloudflare treats `/img.png?v=1` and `/img.png?v=2` as separate
cache entries, so an attacker appending random query strings forces origin
fetches. In **Caching → Cache Rules**, add a rule for image paths that sets a
custom cache key ignoring the query string:

```
When incoming requests match:  (http.request.uri.path matches ".*\\.(png|jpg|jpeg|webp|avif|gif|svg|ico)$")
Then:
  Cache eligibility: Eligible for cache
  Edge TTL: 1 year
  Cache key → Query string: Ignore query string
```

---

## Layer 2 — Signed URLs for private images (CODE)

Private images use signed, expiring URLs so a leaked URL stops working where
something checks it: Cloudflare Images checks its own, and an R2 bucket checks
nothing (see "Verifying a signed URL" below).

| Concern | Port (`@app/core`) | Default adapter (`@app/cloudflare`) | Default (built-in, core) | Composition root (`apps/web`) |
|---|---|---|---|---|
| Image delivery | `IImageDeliveryPort` | `createCloudflareImagesDelivery()` / `createR2SignedDelivery()` | `createPublicImageDelivery()` | `src/lib/image-delivery/imageDelivery.adapter.ts` |

- `buildImageUrl({ path })` → unsigned public URL.
- `buildSignedImageUrl({ path, expiresInSeconds })` → HMAC-signed URL with an
  `exp` and `sig` query param.
- **Cloudflare Images** (`createCloudflareImagesDelivery`): signs the delivery
  URL with `CLOUDFLARE_IMAGES_SIGNING_KEY` (requireSignedURLs). Falls back to
  the public delivery URL when the signing key is absent, and to the bare path
  when the account hash is, as `buildImageUrl` does.
- **R2** (`createR2SignedDelivery`): signs against `R2_SECRET_ACCESS_KEY` and a
  public base URL. Falls back to the public URL when either is absent.
- Both sign through `signImageUrl`: `sig` is the HMAC-SHA256 hex, keyed by the
  secret, of the URL path and its query with `exp` and without `sig`.

### Verifying a signed URL

`verifySignedImageUrl({ secret, url, nowInSeconds? })`, exported by
`@app/cloudflare`, checks a URL either adapter signed, with the same secret
and the same canonical string. It reads no environment variable and does no
I/O, so it runs in the edge runtime and in a Worker. It compares the signature
in constant time and returns `{ valid: true }`, or `{ valid: false, reason }`
with one of `SignedImageUrlRejectionEnum`:

| Reason | When |
|---|---|
| `not_configured` | the secret is empty |
| `malformed` | the URL cannot be parsed; `exp` or `sig` is missing or repeated; `exp` is not whole Unix seconds; `sig` is not 64 lowercase hex characters |
| `signature_mismatch` | the path, the query, `exp` or `sig` changed, or another secret signed it |
| `expired` | a genuine signature whose `exp` is now or past |

Who checks what:

- **Cloudflare Images** checks its own signed URLs: an image that requires
  signed URLs "cannot be accessed without a token"
  ([Cloudflare docs](https://developers.cloudflare.com/images/manage-images/serve-images/serve-private-images/)).
  Nothing in the app needs to call the verifier.
- **R2** checks nothing itself: a public bucket, or a custom domain on it,
  serves any object to whoever has its path, signed or not. A private R2
  object therefore lives in a bucket that is not public, and whatever serves
  it (a Worker bound to the bucket, or an app route that reads it) calls
  `verifySignedImageUrl` with `R2_SECRET_ACCESS_KEY` first and refuses the
  request unless the result is valid. The template ships no such route: its composition root binds the
  unsigned public delivery.

### Swapping the provider (one line)

```ts
// apps/web/src/lib/image-delivery/imageDelivery.adapter.ts
export const imageDelivery: IImageDeliveryPort = createPublicImageDelivery() // DEFAULT
// export const imageDelivery: IImageDeliveryPort = createCloudflareImagesDelivery() // signed CF Images
// export const imageDelivery: IImageDeliveryPort = createR2SignedDelivery() // signed R2
```

**Graceful degrade:** with no signing credentials the signed adapters return
the plain public URL (Cloudflare Images returns the bare path when even the
account hash is missing), so build and validate pass credential-free.

---

## Layer 3 — WAF rate limiting (DASHBOARD)

Block IPs that scrape images. In **Security → WAF → Rate limiting rules**:

```
Rule name:  image-scrape-limit
When:       (http.request.uri.path matches ".*\\.(png|jpg|jpeg|webp|avif|gif|svg|ico)$")
Counting:   requests per IP
Threshold:  100 requests / 1 minute
Action:     Block for 10 minutes
```

Tune the threshold from Cloudflare analytics — start conservative.

---

## Layer 4 — Hotlink protection / WAF referer rule (DASHBOARD)

Stop other sites from embedding your images (bandwidth theft). Enable
**Scrape Shield → Hotlink Protection**, or add an explicit WAF custom rule:

```
Rule name:  block-hotlinking-images
When:       (http.request.uri.path matches ".*\\.(png|jpg|jpeg|webp|avif|gif)$")
            and (not http.referer contains "yourdomain.com")
            and (http.referer ne "")
Action:     Block
```

Leave `http.referer eq ""` allowed so direct loads and privacy browsers work.

---

## Layer 5 — Super Bot Fight Mode (DASHBOARD)

Under **Security → Bots**, enable **Super Bot Fight Mode** (Pro/Business) or
**Bot Fight Mode** (free):

```
Definitely automated:  Block
Likely automated:      Managed Challenge
Verified bots:         Allow   (Googlebot, Bingbot, etc.)
Static resource protection: On
```

This stops scraper bots from bulk-downloading images while letting search
crawlers index them.

---

## Layer 6 — Vercel Spend Management (BACKSTOP)

Cloudflare absorbs most traffic, but set a hard budget as the last line of
defense. In **Vercel → Settings → Billing → Spend Management**, set a monthly
limit and an action (notify, then pause the project) so a cache-bypass attack
cannot run up an unbounded bill.

---

## Environment variables

| Key | Public? | Purpose |
|---|---|---|
| `CLOUDFLARE_IMAGES_ACCOUNT_HASH` | safe | Cloudflare Images delivery account hash |
| `CLOUDFLARE_IMAGES_SIGNING_KEY` | SECRET | HMAC key for signed CF Images URLs |
| `R2_ACCOUNT_ID` | safe | Cloudflare account ID for R2 |
| `R2_ACCESS_KEY_ID` | safe | R2 access key ID |
| `R2_SECRET_ACCESS_KEY` | SECRET | R2 secret — server only |
| `R2_BUCKET` | safe | R2 bucket name |
| `R2_PUBLIC_BASE_URL` | safe | Public base URL for R2 assets |

**Secrets discipline:** signing keys and R2 secrets are NEVER placed in
`NEXT_PUBLIC_` or `EXPO_PUBLIC_` namespaces. They are read server-side only.

# Deploy: S3 + CloudFront (not yet deployed)

Static site from `dist/`. The S3 bucket is private and is only reachable through CloudFront with Origin Access Control (OAC). Nothing here has been run. Replace `[DOMAIN]` (for example `panright.studio`), `[ACCOUNT_ID]`, `[DIST_ID]` and `[CERT_ARN]` before use.

## 0. Before the first deploy

1. Resolve every placeholder in `src/content/site.ts`. `npm run check:placeholders` must exit 0.
2. Set `formEndpoint` to an HTTPS endpoint that accepts POST (S3 cannot process forms). Add its origin to `connect-src` and `form-action` in the CSP (§6).
3. Build with `npm ci && npm run build`. This fails while placeholders remain.
4. Print the CSP with `node scripts/csp.mjs` (§6).

## 1. Bucket (private)

```bash
aws s3api create-bucket --bucket [DOMAIN]-site --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2
aws s3api put-public-access-block --bucket [DOMAIN]-site \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-ownership-controls --bucket [DOMAIN]-site \
  --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]'
aws s3api put-bucket-encryption --bucket [DOMAIN]-site \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```
Leave static website hosting off. CloudFront uses the bucket's REST endpoint.

## 2. Certificate (ACM, must be in us-east-1)

```bash
aws acm request-certificate --region us-east-1 \
  --domain-name [DOMAIN] --subject-alternative-names www.[DOMAIN] \
  --validation-method DNS
```
Add the CNAME validation records ACM returns to DNS (§5), then wait for `ISSUED`.

## 3. Origin Access Control

```bash
aws cloudfront create-origin-access-control --origin-access-control-config \
  'Name=panright-oac,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3'
```

## 4. Distribution

Settings:

- **Origin.** `[DOMAIN]-site.s3.eu-west-2.amazonaws.com` with the OAC above. No OAI and no public bucket.
- **Viewer protocol.** Redirect HTTP to HTTPS. HTTP/2 and HTTP/3 on. TLSv1.2_2021 minimum. Alternate domain names `[DOMAIN]` and `www.[DOMAIN]`, certificate `[CERT_ARN]`.
- **Default root object.** `index.html`.
- **Compression.** *Compress objects automatically* on. CloudFront serves Brotli when the viewer accepts it (`Accept-Encoding: br`), otherwise gzip. The cache policies below enable both encodings in the cache key.
- **Directory URLs.** Astro emits `/about/index.html`. Attach a CloudFront Function (viewer request) that maps `/about/` to `/about/index.html` and redirects `www` to the apex:

```js
function handler(event) {
  var req = event.request;
  var host = req.headers.host && req.headers.host.value;
  if (host && host.indexOf('www.') === 0) {
    return { statusCode: 301, statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://' + host.slice(4) + req.uri } } };
  }
  if (req.uri.endsWith('/')) req.uri += 'index.html';
  else if (!req.uri.includes('.')) {
    return { statusCode: 301, statusDescription: 'Moved Permanently',
      headers: { location: { value: req.uri + '/' } } };
  }
  return req;
}
```
- **404.** Custom error response: 403 and 404 from origin both return `/404.html` with status 404, error caching TTL 60s. A private bucket returns 403 for missing keys.
- **Bucket policy** (only this distribution may read):

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "AllowCloudFrontOAC",
    "Effect": "Allow",
    "Principal": { "Service": "cloudfront.amazonaws.com" },
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::[DOMAIN]-site/*",
    "Condition": { "StringEquals": { "AWS:SourceArn": "arn:aws:cloudfront::[ACCOUNT_ID]:distribution/[DIST_ID]" } }
  }]
}
```

### Cache behaviours

| Path pattern | Cache policy | Notes |
|---|---|---|
| `/_astro/*` | Custom "immutable": min/default/max TTL 31536000, gzip+brotli on, no query or cookie keys | Content-hashed file names |
| Default (`*`) | Custom "html-short": min 0, default 300, max 3600, gzip+brotli on | HTML, sitemap, robots, icons, og.png |

`Cache-Control` is also set on the objects at upload (§7), so browsers follow the same rules.

## 5. DNS

In Route 53 (or your DNS host):

- `[DOMAIN]`: A and AAAA **alias** records pointing to the distribution (`dxxxx.cloudfront.net`). Elsewhere, use ALIAS/ANAME/CNAME-flattening.
- `www.[DOMAIN]`: CNAME (or alias) to the same distribution. The function above redirects it to the apex.
- Keep the ACM validation CNAMEs in place so the certificate renews automatically.
- Optional: a CAA record `0 issue "amazon.com"`.

## 6. Response headers policy

Create a CloudFront response headers policy and attach it to both behaviours:

| Header | Value |
|---|---|
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` (override origin) |
| Content-Security-Policy | output of `node scripts/csp.mjs` (see below) |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | `accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()` |
| X-Frame-Options | `DENY` (CSP `frame-ancestors 'none'` covers modern browsers) |
| Cross-Origin-Opener-Policy | `same-origin` |

The current CSP, which `scripts/csp.mjs` re-derives after every build because the hash covers the inline motion-gate script:

```
default-src 'self'; script-src 'self' 'sha256-…'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; manifest-src 'self'; upgrade-insecure-requests
```

When the form endpoint exists, add its origin to `connect-src` and `form-action`. Only submit HSTS `preload` to hstspreload.org once every subdomain serves HTTPS.

## 7. Upload

```bash
npm ci && npm run build
node scripts/csp.mjs   # update the response headers policy if the hash changed

# 1. Hashed assets: cache for a year, immutable
aws s3 sync dist/_astro s3://[DOMAIN]-site/_astro \
  --cache-control "public, max-age=31536000, immutable" --delete

# 2. Everything else (HTML, sitemap, robots, icons, og.png): short cache, revalidate
aws s3 sync dist s3://[DOMAIN]-site --exclude "_astro/*" \
  --cache-control "public, max-age=300, must-revalidate" --delete

# Correct types for the non-obvious files
aws s3 cp dist/site.webmanifest s3://[DOMAIN]-site/site.webmanifest \
  --content-type "application/manifest+json" --cache-control "public, max-age=300, must-revalidate"
```

Upload assets before HTML, so new HTML never references a file that isn't there yet.

## 8. Invalidation

Hashed assets never need invalidating. After each deploy, invalidate the HTML and the root files:

```bash
aws cloudfront create-invalidation --distribution-id [DIST_ID] \
  --paths "/" "/*.html" "/*/" "/sitemap.xml" "/robots.txt" "/site.webmanifest" "/og.png" "/favicon*"
```
To clear everything, use `--paths "/*"` (it counts as one path toward the monthly free allowance).

## 9. Post-deploy checks

- `curl -sI https://[DOMAIN]/ | grep -iE "strict-transport|content-security|x-content-type|referrer|permissions|content-encoding"`
- `curl -sI -H "Accept-Encoding: br" https://[DOMAIN]/_astro/<file>.js` returns `content-encoding: br` and `cache-control: … immutable`.
- `https://[DOMAIN]/missing/` returns status 404 with the 404 page.
- Lighthouse on the live URL. Expect SEO 100 once `[DOMAIN]` is real (see DECISIONS.md D-28).

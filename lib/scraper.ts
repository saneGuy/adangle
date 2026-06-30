import * as cheerio from "cheerio";

const BLOCKED_HOSTNAMES = ["localhost", "0.0.0.0"];

const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
];

const BLOCKED_IPV6 = ["::1", "::"];

export function validateUrl(urlString: string): URL {
  const url = new URL(urlString);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http/https URLs are allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    throw new Error("Blocked hostname");
  }

  if (BLOCKED_IPV6.includes(hostname)) {
    throw new Error("Blocked IPv6 address");
  }

  if (/^fe[89ab]/i.test(hostname) || /^f[cd]/i.test(hostname)) {
    throw new Error("Private IPv6 address blocked");
  }

  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error("Private IP addresses are blocked");
    }
  }

  return url;
}

export function extractTextFromHtml(html: string): string {
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, iframe, noscript").remove();

  const text = $("body").text();

  const cleaned = text.replace(/\s+/g, " ").trim();

  return cleaned.slice(0, 15000);
}

const MAX_REDIRECTS = 3;
const MAX_SIZE = 5 * 1024 * 1024;

export async function fetchAndExtract(urlString: string): Promise<string> {
  let currentUrl = urlString;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    validateUrl(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "AdAngle/1.0 (product-analysis)",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("Redirect without Location header");
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) {
        throw new Error("URL did not return HTML content");
      }

      const contentLength = response.headers.get("content-length");
      if (contentLength && parseInt(contentLength) > MAX_SIZE) {
        throw new Error("Response too large (>5MB)");
      }

      const html = await response.text();

      if (html.length > MAX_SIZE) {
        throw new Error("Response too large (>5MB)");
      }

      return extractTextFromHtml(html);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("Too many redirects");
}

import { describe, it, expect } from "vitest";
import { validateUrl, extractTextFromHtml } from "@/lib/scraper";

describe("validateUrl", () => {
  it("accepts https URL", () => {
    expect(() => validateUrl("https://example.com")).not.toThrow();
  });

  it("accepts http URL", () => {
    expect(() => validateUrl("http://example.com")).not.toThrow();
  });

  it("rejects ftp URL", () => {
    expect(() => validateUrl("ftp://example.com")).toThrow("Only http/https");
  });

  it("rejects localhost", () => {
    expect(() => validateUrl("http://localhost/admin")).toThrow();
  });

  it("rejects 127.0.0.1", () => {
    expect(() => validateUrl("http://127.0.0.1/secret")).toThrow();
  });

  it("rejects 10.x.x.x", () => {
    expect(() => validateUrl("http://10.0.0.1/internal")).toThrow();
  });

  it("rejects 172.16.x.x", () => {
    expect(() => validateUrl("http://172.16.0.1/internal")).toThrow();
  });

  it("rejects 192.168.x.x", () => {
    expect(() => validateUrl("http://192.168.1.1/internal")).toThrow();
  });

  it("rejects 169.254.x.x (link-local)", () => {
    expect(() => validateUrl("http://169.254.169.254/metadata")).toThrow();
  });

  it("rejects 0.0.0.0", () => {
    expect(() => validateUrl("http://0.0.0.0/")).toThrow();
  });

  it("rejects IPv6 loopback", () => {
    expect(() => validateUrl("http://[::1]/")).toThrow();
  });
});

describe("extractTextFromHtml", () => {
  it("extracts text content from HTML", () => {
    const html = '<html><head><title>Product</title></head><body><h1>Amazing Widget</h1><p>Saves you 10 hours per week.</p><script>alert("xss")</script><style>.hidden{display:none}</style></body></html>';
    const text = extractTextFromHtml(html);
    expect(text).toContain("Amazing Widget");
    expect(text).toContain("Saves you 10 hours per week");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("display:none");
  });

  it("truncates very long text", () => {
    const html = '<html><body><p>' + "word ".repeat(20000) + '</p></body></html>';
    const text = extractTextFromHtml(html);
    expect(text.length).toBeLessThanOrEqual(15000);
  });
});

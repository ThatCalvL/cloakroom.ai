import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  bootstrapUser,
  fetchCloset,
  fetchHealth,
  generateTryOn,
  toAssetUrl,
} from "@/lib/api";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client smoke tests", () => {
  it("returns true when health endpoint is ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ status: "ok" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    const result = await fetchHealth();
    expect(result).toBe(true);
  });

  it("builds bootstrap payload correctly", async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify({ id: 1, email: "a@a.com" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    await bootstrapUser("a@a.com", "Test User", "https://avatar.local");

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.full_name).toBe("Test User");
    expect(body.avatar_image_url).toBe("https://avatar.local");
  });

  it("throws ApiError for non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify({ detail: "bad request" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );

    await expect(fetchCloset(9)).rejects.toBeInstanceOf(ApiError);
  });

  it("calls try-on endpoint and parses response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              outfit_id: 7,
              generated_image_url: "https://example.com/result.png",
              message: "ok",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ),
    );

    const payload = await generateTryOn({ user_id: 1, top_id: 2 });
    expect(payload.outfit_id).toBe(7);
    expect(payload.generated_image_url).toContain("result.png");
  });

  it("normalizes relative asset URL", () => {
    expect(toAssetUrl("/static/image.png")).toContain("/static/image.png");
  });
});

export function createApiClient() {
  let appToken = "";
  let appPort = 8787;

  async function bootstrap() {
    try {
      const res = await fetch("/api/bootstrap", { cache: "no-store" });
      if (!res.ok) throw new Error("bootstrap " + res.status);
      const data = await res.json();
      appToken = data && typeof data.token === "string" ? data.token : "";
      if (data && Number(data.port)) appPort = Number(data.port);
      return data;
    } catch (err) {
      appToken = "";
      console.error("bootstrap failed", err);
      return null;
    }
  }

  async function request(url, options = {}) {
    const opts = { ...options };
    const method = String(opts.method || "GET").toUpperCase();
    const needsToken = method === "POST" || method === "PUT" || method === "DELETE" || method === "PATCH";
    const headers = { ...(opts.headers || {}) };
    if (needsToken && appToken) headers["X-App-Token"] = appToken;
    if (opts.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
    opts.headers = headers;
    return fetch(url, opts);
  }

  return {
    bootstrap,
    request,
    getPort: () => appPort,
  };
}

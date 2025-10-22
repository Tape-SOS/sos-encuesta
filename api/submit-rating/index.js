const fetch = require("node-fetch");

module.exports = async function (context, req) {
  if (req.method !== "POST") {
    context.res = { status: 405, body: "Method not allowed" };
    return;
  }

  const FLOW_URL = process.env.FLOW_SUBMIT_URL;
  const FLOW_API_KEY = process.env.FLOW_API_KEY;

  try {
    const { eventId, token, scores, comments, source } = req.body || {};
    if (!eventId || !token || !scores) {
      context.res = { status: 400, body: "Faltan campos" };
      return;
    }

    const keys = ["atencion", "solucion", "cortesia", "tiempo"];
    for (const k of keys) {
      const v = Number(scores[k]);
      if (!(v >= 1 && v <= 5)) {
        context.res = { status: 400, body: `Score inválido: ${k}` };
        return;
      }
    }

    const headerKey = req.headers["x-api-key"] || req.headers["X-API-KEY"];
    if (!headerKey || headerKey !== FLOW_API_KEY) {
      context.res = { status: 401, body: "Unauthorized" };
      return;
    }

    const r = await fetch(FLOW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        token,
        scores,
        comments: comments || null,
        source: source || "portal-swa"
      })
    });

    const text = await r.text();
    context.res = { status: r.status, body: text };
  } catch (err) {
    context.log("submit-rating error:", err && err.message ? err.message : err);
    context.res = { status: 500, body: "Error interno" };
  }
};

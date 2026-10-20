import type { RequestHandler } from "express";
import { env } from "../config/env.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Cross-site request defense for cookie-backed JSON API operations.
 * A valid CORS configuration alone cannot stop HTML form submissions.
 * Unknown origins and cross-site requests without Origin are refused.
 * Requests without Origin from non-browser clients remain supported.
 */
export const requireTrustedOrigin: RequestHandler = (req, res, next) => {
  if (!unsafeMethods.has(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const fetchSite = req.headers["sec-fetch-site"];
  let authorized = !origin;
  if (origin) {
    try {
      const parsed = new URL(origin);
      authorized = (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        env.frontendOrigins.includes(parsed.origin);
    } catch {
      authorized = false;
    }
  }

  // Some cross-site form requests arrive without an Origin header.
  if (!authorized || (fetchSite === "cross-site" && !origin)) {
    res.status(403).json({
      error: "UNTRUSTED_ORIGIN",
      message: "Esta solicitud no está permitida desde ese sitio.",
    });
    return;
  }

  next();
};

import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Request-validation middleware factory. Parses the requested parts with the
 * given Zod schemas and stores the typed results on `req.validated` (Express 5
 * makes req.query/params read-only, so we never reassign them). A ZodError is
 * forwarded to the central error handler, which renders a 400.
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.validated = {};
      if (schemas.params) req.validated.params = schemas.params.parse(req.params);
      if (schemas.query) req.validated.query = schemas.query.parse(req.query);
      if (schemas.body) req.validated.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Application-level read operations.
 *
 * Separate from `catalog.service.js` on purpose: that module is about the
 * catalog as a whole (categories, supported environments, integrity), this one
 * is about a single application and what it means *for a given environment*.
 *
 * This is where a catalog entry stops being inert metadata and becomes an
 * answer: "can I install this, here, and by what route?" It delegates that
 * judgement to `@configshell/installer` rather than re-implementing it, so the
 * API, the web app and any future CLI cannot disagree.
 */

import { resolve } from "@configshell/installer";
import { getApplication } from "./catalog.service.js";

/**
 * One application plus its resolution for an environment.
 *
 * The resolution is returned in full — including `considered`, which records
 * every source that was looked at and why it was or was not chosen. That is
 * what makes the choice auditable instead of a black box.
 */
export function describeApplication(id, environment) {
  const application = getApplication(id);
  if (!application) return undefined;
  if (!environment) return { application };
  return { application, resolution: resolve(application, environment) };
}

import { apiker } from "../Apiker";

/**
 * Responses
 */
export const res_404 = (error = "Not Found") => {
  return new Response(JSON.stringify({ error }, undefined, apiker.debug ? 4 : undefined), {
    status: 404,
  });
};

export const res = (data = {}, status = 200) => {
  return new Response(JSON.stringify({ ...data }, undefined, apiker.debug ? 4 : undefined), {
    status,
  });
};
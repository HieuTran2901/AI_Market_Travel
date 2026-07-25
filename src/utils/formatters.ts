/**
 * Formats a date string (YYYY-MM-DD) into a human readable date (e.g. 23 Jul 2026)
 * Avoids timezone shift issues associated with `new Date("YYYY-MM-DD")`
 */
export const formatDateOnly = (value?: string | null): string => {
  if (!value) return "Not available";

  const parts = value.split("-");
  if (parts.length !== 3) return "Not available";
  
  const [year, month, day] = parts.map(Number);

  if (!year || !month || !day) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
};

/**
 * Resolves an image URL so it can be safely used in an <img src>
 * Handles absolute URLs, data URIs, and backend relative paths.
 */
export const resolveImageUrl = (url?: string | null): string | null => {
  if (!url) return null;

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }

  const apiOrigin = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ?? 'http://localhost:8080';
  return `${apiOrigin}${url.startsWith("/") ? url : `/${url}`}`;
};

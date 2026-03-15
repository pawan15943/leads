/**
 * Parse API and network errors into user-friendly messages
 */
export function parseApiError(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message
    if (err.name === "AbortError") {
      return "Request timed out. Please try again."
    }
    if (msg.includes("401") || msg.includes("Unauthenticated")) {
      return "Session expired. Please log in again."
    }
    if (msg.includes("403") || msg.includes("Forbidden")) {
      return "You don't have permission to perform this action."
    }
    if (msg.includes("404") || msg.includes("Not Found")) {
      return "The requested resource was not found."
    }
    if (msg.includes("422") || msg.includes("Unprocessable")) {
      return msg
    }
    if (msg.includes("429") || msg.includes("Too Many Requests")) {
      return "Too many requests. Please wait a moment and try again."
    }
    if (msg.includes("500") || msg.includes("Internal Server Error")) {
      return "Server error. Please try again later."
    }
    if (msg.includes("502") || msg.includes("Bad Gateway")) {
      return "Server temporarily unavailable. Please try again."
    }
    if (msg.includes("503") || msg.includes("Service Unavailable")) {
      return "Service temporarily unavailable. Please try again."
    }
    if (
      msg.includes("fetch") ||
      msg.includes("network") ||
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError")
    ) {
      return "Cannot connect. Check your internet connection and try again."
    }
    if (msg.includes("CORS") || msg.includes("cross-origin")) {
      return "Connection blocked. Ensure the API is configured correctly."
    }
    return msg || "Something went wrong. Please try again."
  }
  return "Something went wrong. Please try again."
}

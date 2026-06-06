// Mock for isomorphic-dompurify to avoid ESM issues in Jest
export function sanitize(html) {
  // Simple pass-through for testing - in production this would sanitize HTML
  return html || '';
}
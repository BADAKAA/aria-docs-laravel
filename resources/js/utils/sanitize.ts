import DOMPurify from 'dompurify';

// Trusted Types support: create a policy if available
let trustedPolicyName = 'dompurify';

// Ensure DOMPurify is configured for Trusted Types
// When RETURN_TRUSTED_TYPE is true and Trusted Types are available, it returns TrustedHTML
export function sanitizeHTML(html: string): string | TrustedHTML {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'a',
      'h1',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    RETURN_TRUSTED_TYPE: true,
    FORBID_TAGS: ['script', 'style'],
  }) as string | TrustedHTML;
}

// Helper to assign sanitized HTML safely using innerHTML
export function setSanitizedHTML(el: Element | null, html: string) {
  if (!el) return;
  const sanitized = sanitizeHTML(html);
  // React's dangerouslySetInnerHTML may not play well with Trusted Types + CSP enforcement,
  // so we assign directly to innerHTML with a TrustedHTML when available.
  // TypeScript doesn't know innerHTML accepts TrustedHTML, so cast.
  (el as any).innerHTML = sanitized as any;
}

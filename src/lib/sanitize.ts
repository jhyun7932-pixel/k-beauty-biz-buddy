import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks.
 * Allows safe document formatting tags only.
 */
export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'div', 'span', 'br', 'hr',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption', 'colgroup', 'col',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'strong', 'em', 'b', 'i', 'u', 's', 'sub', 'sup', 'small', 'mark',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'figure', 'figcaption',
      'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
    ],
    ALLOWED_ATTR: ['class', 'style', 'id', 'href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'width', 'height', 'target', 'rel'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  });
}

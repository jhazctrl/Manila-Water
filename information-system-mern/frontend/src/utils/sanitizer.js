/**
 * Client-side Sanitizer
 * Uses DOMPurify to prevent XSS when rendering user content
 */
import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty) => {
    if (typeof dirty !== 'string') return '';
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p'],
        ALLOWED_ATTR: [],
    });
};

export const sanitizeInput = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/<[^>]*>/g, '');
};

export const escapeForDisplay = (str) => {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};

import { useEffect } from 'react';

/**
 * Custom Hook for Page-level SEO Management
 * Dynamically updates document title, meta descriptions, canonical URLs, and Open Graph tags.
 *
 * @param {object} params
 * @param {string} params.title
 * @param {string} [params.description]
 * @param {string} [params.canonicalUrl]
 * @param {string} [params.ogType='website']
 */
export const useSEO = ({
  title,
  description,
  canonicalUrl,
  ogType = 'website'
} = {}) => {
  useEffect(() => {
    // 1. Set Document Title
    const formattedTitle = title
      ? `${title} | Hero Showroom`
      : 'Hero Showroom — Premium Automotive Discovery Platform';
    document.title = formattedTitle;

    // Helper to set or create a meta tag
    const setMetaTag = (selector, attributeName, attributeValue, content) => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attributeName, attributeValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // 2. Set Meta Description
    if (description) {
      setMetaTag('meta[name="description"]', 'name', 'description', description);
      setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    }

    // 3. Set Open Graph Title & Type
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', formattedTitle);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);

    // 4. Set Canonical URL & og:url
    const currentUrl = canonicalUrl || window.location.href;
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', currentUrl);
  }, [title, description, canonicalUrl, ogType]);
};

export default useSEO;

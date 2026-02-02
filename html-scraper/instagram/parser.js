/**
 * Instagram HTML Parser
 * Parses static Instagram page HTML and extracts profile/post data from
 * meta tags, JSON-LD, and embedded script data.
 */

(function (global) {
  'use strict';

  function parseHTML(htmlString) {
    const parser = new DOMParser();
    return parser.parseFromString(htmlString, 'text/html');
  }

  /**
   * Extract meta tags into a flat object (property or name -> content).
   */
  function extractMeta(doc) {
    const meta = {};
    doc.querySelectorAll('meta[content]').forEach((el) => {
      const prop = el.getAttribute('property') || el.getAttribute('name') || el.getAttribute('itemprop');
      const content = el.getAttribute('content')?.trim();
      if (prop && content) meta[prop] = content;
    });
    return meta;
  }

  /**
   * Extract JSON-LD from script type="application/ld+json".
   */
  function extractJsonLd(doc) {
    const items = [];
    doc.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      const text = script.textContent?.trim();
      if (!text) return;
      try {
        const data = JSON.parse(text);
        items.push(Array.isArray(data) ? data : [data]);
      } catch (_) {
        // skip invalid JSON
      }
    });
    return items.flat();
  }

  /**
   * Find and parse JSON in script tags (e.g. window.__additionalDataLoaded(...)).
   */
  function extractScriptJson(doc) {
    const found = [];
    doc.querySelectorAll('script:not([type]), script[type="text/javascript"]').forEach((script) => {
      const text = script.textContent || '';
      // Common Instagram patterns: JSON in assignment or function call
      const patterns = [
        /(?:require\s*\(\s*["']ScheduledServerJS["']\s*\)\s*\.\s*handle\s*\(\s*)(\{[\s\S]*?\})\s*\)/,
        /(?:window\.__additionalDataLoaded\s*\(\s*[^,]+,\s*)(\{[\s\S]*?\})\s*\)/,
        /(?:window\._sharedData\s*=\s*)(\{[\s\S]*?\});?\s*(?:\s*<\/script>|$)/,
        /(?:<script[^>]*>[\s\S]*?)(\{[\s\S]*?"(?:user|graphql|entry_data|config)"[\s\S]*?\})(?:\s*<\/script>|$)/,
      ];
      for (const re of patterns) {
        const m = text.match(re);
        if (m && m[1]) {
          try {
            const data = JSON.parse(m[1]);
            found.push(data);
            break;
          } catch (_) {}
        }
      }
    });
    return found;
  }

  /**
   * Parse follower/following/posts from og:description text.
   * e.g. "123K Followers, 456 Following, 789 Posts - See Instagram..."
   */
  function parseStatsFromDescription(description) {
    if (!description || typeof description !== 'string') return null;
    const stats = { followers: null, following: null, posts: null };

    function parseCount(str) {
      if (!str) return null;
      const cleaned = str.replace(/\s+/g, '').replace(/,/g, '');
      const m = cleaned.match(/^([\d.]+)\s*([KkMm])?$/);
      if (!m) return null;
      let n = parseFloat(m[1], 10);
      const suffix = (m[2] || '').toUpperCase();
      if (suffix === 'K') n *= 1000;
      else if (suffix === 'M') n *= 1000000;
      return Math.round(n);
    }

    const followersMatch = description.match(/([\d.,]+\s*[KkMm]?)\s*Followers?/i);
    const followingMatch = description.match(/([\d.,]+\s*[KkMm]?)\s*Following/i);
    const postsMatch = description.match(/([\d.,]+\s*[KkMm]?)\s*Posts?/i);

    if (followersMatch) stats.followers = parseCount(followersMatch[1]);
    if (followingMatch) stats.following = parseCount(followingMatch[1]);
    if (postsMatch) stats.posts = parseCount(postsMatch[1]);

    if (stats.followers === null && stats.following === null && stats.posts === null) return null;
    return stats;
  }

  /**
   * Recursively find numeric count in nested objects (Instagram script JSON).
   */
  function findCount(obj, path) {
    if (obj == null || typeof obj !== 'object') return null;
    const keys = path.split('.');
    let cur = obj;
    for (const key of keys) {
      cur = cur[key];
      if (cur == null) return null;
    }
    return typeof cur === 'number' ? cur : null;
  }

  /**
   * Extract followers, following, posts from embedded script JSON.
   */
  function extractStatsFromScriptData(scriptData) {
    if (!Array.isArray(scriptData) || scriptData.length === 0) return null;
    const stats = { followers: null, following: null, posts: null };

    function walk(obj, depth) {
      if (depth > 20 || obj == null) return;
      if (typeof obj !== 'object') return;
      if (Array.isArray(obj)) {
        obj.forEach(function (item) { walk(item, depth + 1); });
        return;
      }
      // Instagram profile user node
      if (obj.edge_followed_by != null && typeof obj.edge_followed_by.count === 'number') {
        stats.followers = obj.edge_followed_by.count;
      }
      if (obj.edge_follow != null && typeof obj.edge_follow.count === 'number') {
        stats.following = obj.edge_follow.count;
      }
      if (obj.edge_owner_to_timeline_media != null) {
        const media = obj.edge_owner_to_timeline_media;
        if (typeof media.count === 'number') stats.posts = media.count;
      }
      Object.keys(obj).forEach(function (key) {
        walk(obj[key], depth + 1);
      });
    }

    scriptData.forEach(function (data) { walk(data, 0); });

    if (stats.followers === null && stats.following === null && stats.posts === null) return null;
    return stats;
  }

  /**
   * Build a normalized profile/post object from meta and optional JSON.
   */
  function normalizeFromMeta(meta) {
    const result = {
      type: null,
      username: null,
      fullName: null,
      description: null,
      image: null,
      url: null,
      video: null,
      siteName: null,
      rawMeta: meta,
    };

    result.url = meta['og:url'] || meta['twitter:url'] || null;
    result.description = meta['og:description'] || meta['twitter:description'] || meta.description || null;
    result.image = meta['og:image'] || meta['twitter:image'] || meta['twitter:image:src'] || null;
    result.siteName = meta['og:site_name'] || null;

    const title = meta['og:title'] || meta['twitter:title'] || meta.title || '';
    if (title) {
      // "Username (@handle) • Instagram" or "Post by Username • Instagram"
      const atMatch = title.match(/@([a-zA-Z0-9._]+)/);
      if (atMatch) result.username = atMatch[1];
      const byMatch = title.match(/^(?:.*?)\s*(?:by\s+)?([^•@]+?)(?:\s*[•@]|$)/);
      if (byMatch && !result.username) result.fullName = byMatch[1].trim();
      if (result.username && !result.fullName) {
        const namePart = title.split('•')[0].replace(/@[a-zA-Z0-9._]+/, '').trim();
        if (namePart) result.fullName = namePart;
      }
    }

    result.video = meta['og:video'] || meta['og:video:url'] || meta['twitter:player:stream'] || null;
    if (result.video || (meta['og:type'] && meta['og:type'].toLowerCase().includes('video'))) {
      result.type = 'video';
    } else if (result.image || result.url) {
      result.type = result.url && /\/p\//.test(result.url) ? 'post' : 'profile';
    }

    return result;
  }

  /**
   * Extract profile/post data from JSON-LD (Person, ImageObject, etc.).
   */
  function normalizeFromJsonLd(items) {
    const result = { profile: null, post: null, items: [] };
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const type = item['@type'];
      const name = item.name || item.alternateName;
      const desc = item.description;
      const img = item.image?.url || (typeof item.image === 'string' ? item.image : null);
      const url = item.url;
      if (type === 'Person' || type === 'ProfilePage') {
        result.profile = {
          name: name || item.name,
          description: desc,
          image: img,
          url,
          identifier: item.identifier,
        };
      }
      if (type === 'ImageObject' || type === 'VideoObject') {
        result.post = result.post || {};
        result.post.caption = desc || item.caption;
        result.post.image = type === 'ImageObject' ? (img || url) : null;
        result.post.video = type === 'VideoObject' ? (item.contentUrl || url) : null;
        result.post.url = url;
      }
      result.items.push(item);
    }
    return result;
  }

  /**
   * Main entry: parse Instagram HTML and return structured data.
   */
  function parse(htmlString) {
    const doc = parseHTML(htmlString);
    const meta = extractMeta(doc);
    const jsonLd = extractJsonLd(doc);
    const scriptJson = extractScriptJson(doc);

    const fromMeta = normalizeFromMeta(meta);
    const fromLd = normalizeFromJsonLd(jsonLd);
    const statsFromDesc = parseStatsFromDescription(fromMeta.description);
    const statsFromScript = extractStatsFromScriptData(scriptJson);
    const stats = {
      followers: (statsFromScript && statsFromScript.followers != null) ? statsFromScript.followers : (statsFromDesc && statsFromDesc.followers),
      following: (statsFromScript && statsFromScript.following != null) ? statsFromScript.following : (statsFromDesc && statsFromDesc.following),
      posts: (statsFromScript && statsFromScript.posts != null) ? statsFromScript.posts : (statsFromDesc && statsFromDesc.posts),
    };
    const hasStats = stats.followers != null || stats.following != null || stats.posts != null;

    const result = {
      profile: {
        username: fromMeta.username,
        fullName: fromMeta.fullName,
        description: fromMeta.description,
        image: fromMeta.image,
        url: fromMeta.url,
        ...(hasStats ? { stats } : {}),
        ...(fromLd.profile || {}),
      },
      post: fromMeta.type === 'post' || fromMeta.type === 'video' ? {
        description: fromMeta.description,
        image: fromMeta.image,
        video: fromMeta.video,
        url: fromMeta.url,
        type: fromMeta.type,
        ...(fromLd.post || {}),
      } : (fromLd.post || null),
      meta: meta,
      jsonLd: jsonLd.length ? jsonLd : undefined,
      scriptData: scriptJson.length ? scriptJson : undefined,
      pageType: fromMeta.type,
    };

    return result;
  }

  global.InstagramParser = {
    parse,
    parseHTML,
    extractMeta,
    extractJsonLd,
    extractScriptJson,
    parseStatsFromDescription,
    extractStatsFromScriptData,
    normalizeFromMeta,
    normalizeFromJsonLd,
  };
})(typeof window !== 'undefined' ? window : this);

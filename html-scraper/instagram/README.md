# Instagram Parser

Parses static Instagram page HTML and extracts profile/post data from meta tags, JSON-LD, and embedded script data.

## Usage

### In the browser

```html
<script src="parser.js"></script>
<script>
  const html = '<html>...</html>'; // Instagram page HTML
  const data = InstagramParser.parse(html);
  console.log(data.profile);  // username, fullName, description, image, url
  console.log(data.post);     // for post pages: description, image, video, url
  console.log(data.meta);     // all meta tags
  console.log(data.jsonLd);   // JSON-LD items if present
  console.log(data.scriptData); // parsed JSON from script tags if found
</script>
```

### API

- **`InstagramParser.parse(htmlString)`**  
  Returns an object:
  - `profile` – `username`, `fullName`, `description`, `image`, `url` (from meta/JSON-LD), and when available:
    - **`stats`** – `followers`, `following`, `posts` (numbers; parsed from og:description or embedded script JSON, e.g. "123K Followers" → 123000)
  - `post` – for post/reel pages: `description`, `image`, `video`, `url`, `type`
  - `meta` – all meta tags (property/name → content)
  - `jsonLd` – array of JSON-LD objects (if any)
  - `scriptData` – array of JSON objects extracted from script tags (if any)
  - `pageType` – `'profile'`, `'post'`, or `'video'`

- **`InstagramParser.parseHTML(htmlString)`** – Returns a `Document` (DOMParser).
- **`InstagramParser.extractMeta(doc)`** – Returns meta tags as a flat object.
- **`InstagramParser.extractJsonLd(doc)`** – Returns array of JSON-LD objects.
- **`InstagramParser.extractScriptJson(doc)`** – Returns array of JSON from script content.
- **`InstagramParser.parseStatsFromDescription(description)`** – Parses "X Followers", "X Following", "X Posts" from og:description text (supports K/M suffixes). Returns `{ followers, following, posts }` or null.
- **`InstagramParser.extractStatsFromScriptData(scriptData)`** – Extracts followers/following/posts from embedded script JSON (e.g. `edge_followed_by.count`, `edge_follow.count`, `edge_owner_to_timeline_media.count`).

## Getting the HTML

Paste HTML from an Instagram profile or post page (e.g. after “View page source” or “Inspect” in the browser). The parser uses:

- **Meta tags** – `og:title`, `og:description`, `og:image`, `og:url`, `twitter:*`, etc.
- **JSON-LD** – `<script type="application/ld+json">` if present.
- **Script JSON** – Common patterns in inline scripts (e.g. `__additionalDataLoaded`, `_sharedData`).

Note: Instagram often loads content via JavaScript; static HTML may only contain meta and initial JSON. For full data you’d need a headless browser or their official API.

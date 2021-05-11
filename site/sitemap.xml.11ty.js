import React from "react";

import { renderToStaticMarkup } from "react-dom/server";

export function data() {
  return {
    permalink: "/sitemap.xml",
    eleventyExcludeFromCollections: true,
  };
}

export async function render(data) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    renderToStaticMarkup(
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        {data.collections.all.map((p, i) => {
          return (
            <url key={i}>
              <loc>
                {p.url || this.url || this.absoluteUrl(this.metadata.url)}
              </loc>
              <lastmod>{this.htmlDateString(p.date)}</lastmod>
            </url>
          );
        })}
      </urlset>
    )
  );
}

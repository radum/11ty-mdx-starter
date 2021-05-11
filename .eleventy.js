const htmlmin = require("html-minifier");
const { DateTime } = require("luxon");
const fs = require("fs");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginNavigation = require("@11ty/eleventy-navigation");

module.exports = function (eleventyConfig) {
  eleventyConfig.setFrontMatterParsingOptions({
    excerpt: true,
    // Optional, default is "---"
    excerpt_separator: "<!-- excerpt -->",
  });
  function registerComponents() {
    const { mdxRenderer } = require(`./components/index.tsx`);
    const MarkDownHandler = {
      compile: function (body) {
        const fns = this.config.javascriptFunctions;
        return function (data) {
          return mdxRenderer(body, data, fns);
        };
      },
    };

    const mdxPlugin = (eleventyConfig) => {
      eleventyConfig.addTemplateFormats("mdx");
      eleventyConfig.addExtension("mdx", MarkDownHandler);
      eleventyConfig.addExtension("md", MarkDownHandler);
    };

    eleventyConfig.addPlugin(mdxPlugin);
  }

  registerComponents();

  eleventyConfig.addWatchTarget("./components");
  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginNavigation);

  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat(
      "dd LLL yyyy"
    );
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  // TRANSFORM -- Minify HTML Output
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    if (outputPath && outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return "<!doctype html>" + minified;
    }
    return content;
  });

  eleventyConfig.addCollection("mdxNav", function (collection) {
    const mdxNav = [];
    const all = collection.getAll();
    all.forEach((item) => {
      if (item.data?.mdxNav) {
        const entry = {
          ...(item.data?.mdxNav ?? {}),
          url: item.url,
        };
        mdxNav.push(entry);
      }
    });
    return mdxNav;
  });

  // Copy the `img` and `css` folders to the output
  eleventyConfig.addPassthroughCopy("site/img");
  // eleventyConfig.addPassthroughCopy("site/css");

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = fs.readFileSync("_site/404.html");

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false,
  });

  return {
    templateFormats: ["md", "mdx", "11ty.js"],
    dir: {
      input: "site",
      data: "_data",
      output: "_site",
    },
  };
};

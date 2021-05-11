import React from "react";
import ReactDOM from "react-dom/server";
import { MDXProvider } from "@mdx-js/react";
import MDX from "@mdx-js/runtime";
import { ServerStyleSheet } from "styled-components";
import tw from "twin.macro";
import { GlobalStyles } from "twin.macro";
import cheerio from "cheerio";
import PurgeCSS from "@fullhuman/postcss-purgecss";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import cssnano from "cssnano";

import { CodeBlock } from "./Components";
import { NavBar } from "./NavBar";
const Context = React.createContext(
  {} as unknown as { data: EleventyData; fns: Record<string, Function> }
);
type MDXable = string;
type EleventyData = {
  permalink?: string;
  tags?: string[];
  page: {
    date: Date;
    url: string;
    inputPath: string;
    title?: string;
    excerpt?: string;
  };
  skipStyles?: boolean;
  date?: Date;
  _templateContent?: string;
  templateComponent?: string;
  title?: string;
  description?: string;
  author?: string;
  metadata: {
    url: string;
    title: string;
    description: string;
  };
  collections: {
    mdxNav: { key: string; order: number; url: string }[];
    tagList: string[];
    posts: {
      data: EleventyData & {
        frontMatter: {
          content: MDXable;
        };
      };
    }[];
  };
};

function PostList() {
  const { data } = useContext();
  return (
    <div tw="grid sm:grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
      {data.collections.posts.map((p, i) => {
        const page = p.data;
        return (
          <a
            key={i}
            tw="bg-amazon-20 rounded-md flex items-center flex-col justify-center p-4"
            href={p.data.page.url}
          >
            <h4 tw="text-xl">{page.title}</h4>
            <p tw="text-sm">{page.description}</p>
            {p.data.page.excerpt && (
              <MDX scope={data}>{p.data.page.excerpt}</MDX>
            )}
          </a>
        );
      })}
    </div>
  );
}

export function useContext() {
  return React.useContext(Context);
}

function Default({ children }: { children: React.ReactNode }) {
  const { data, fns } = useContext();

  return (
    <html lang="en">
      <head>
        <title>{data?.title ?? data.metadata.title}</title>
        <meta charSet="utf-8" />
        <meta
          name={"description"}
          content={
            data.description ?? data.metadata.description ?? data.metadata.title
          }
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <NavBar />
        <div tw="container mx-auto px-4">{children}</div>
      </body>
    </html>
  );
}

function DirectionalButtonFactory(filter: string): React.FunctionComponent {
  return function () {
    const { fns, data } = React.useContext(Context);
    try {
      const prev = fns[filter](data.collections.posts, data.page);
      if (!prev) {
        return null;
      }
      return <a href={prev?.url}>{prev?.data?.title ?? "aaaaa"}</a>;
    } catch (err) {
      return null;
    }
  };
}
const Previous = DirectionalButtonFactory("getPreviousCollectionItem");
const Next = DirectionalButtonFactory("getNextCollectionItem");

export async function mdxRenderer(
  body: string,
  data: EleventyData,
  jsFunctions: Record<string, Function>
): Promise<string> {
  const components = {
    h1: tw.h1`text-blue-200 text-xl font-bold`,
    h2: tw.h2`text-blue-300 text-lg font-semibold`,
    a: tw.a`text-blue-500 underline hover:text-blue-300 visited:text-purple-300`,
    blockquote: tw.blockquote`rounded-t-xl overflow-hidden bg-gradient-to-r from-indigo-50 to-gray-100 p-10`,
    ul: tw.ul`list-disc`,
    ol: tw.ol`list-decimal`,
    code: CodeBlock,
    Previous,
    Next,
    PostList,
  };

  const simple = data?.permalink === body;
  if (simple) {
    return body;
  }

  const sheet = new ServerStyleSheet();
  let htmlBody = "";
  let collectedStyles = "";

  try {
    htmlBody = ReactDOM.renderToStaticMarkup(
      sheet.collectStyles(
        <>
          <Context.Provider value={{ data, fns: jsFunctions } ?? null}>
            <GlobalStyles />
            <Default>
              <MDXProvider components={components}>
                <MDX scope={data}>{body}</MDX>
              </MDXProvider>
            </Default>
          </Context.Provider>
        </>
      )
    );
    collectedStyles = sheet.getStyleTags();
  } catch (err) {
    console.error(err);
  } finally {
    sheet.seal();

    const prefixed = await postcss([
      autoprefixer({
        overrideBrowserslist: (data as any)?.pkg?.browerlist ?? [
          "last 1 version",
          "> 1%",
          "IE 10",
        ],
      }),
      cssnano({
        preset: ["default", { discardComments: { removeAll: true } }],
      }),
      PurgeCSS({
        content: [
          {
            raw: htmlBody,
            extension: "html",
          },
        ],
      }),
    ] as any).process(
      collectedStyles.replace(/<[^/]+>/, "").replace("</style>", "")
    );
    const $ = cheerio.load(htmlBody);
    $("head").append(`<style>${prefixed.css}</style>`);

    return $.html();
  }
}

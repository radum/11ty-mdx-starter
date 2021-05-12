import React from "react";
import ReactDOM from "react-dom/server";
import MDX from "@mdx-js/runtime";
import styled, { ServerStyleSheet } from "styled-components";
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

type CollectionItem = {
  data: EleventyData & {
    frontMatter: {
      content: MDXable;
    };
  };
};
type EleventyData = {
  mdxType?: "post" | "jumbotron";
  toc?: boolean;
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
    all: CollectionItem[];
    posts: CollectionItem[];
  };
};

const HeaderFactory =
  (component: any) =>
  ({ children }: any) => {
    const { fns } = useContext();
    const C = component;
    return <C id={fns.slug(children)}>{children}</C>;
  };

const Li = tw.li``;

const FootnoteOrListItem = ({ children, ...props }: any) => {
  const kiddos = React.Children.toArray(children);
  const isAFootNote = kiddos.some(
    (c: any) => c?.props?.className === "footnote-backref"
  );

  if (!isAFootNote) {
    return <Li {...{ ...props, children }} />;
  }

  return (
    <Li {...props}>
      {kiddos.map((k: any, i: number) => {
        if (k?.props?.className !== "footnote-backref") {
          return <span key={i}>{k}</span>;
        }
        return (
          <a href={k.props.href} key={i} tw="text-gray-800">
            {" "}
            <span role="img" aria-label="Back Arrow">
              ↰
            </span>
          </a>
        );
      })}
    </Li>
  );
};

const TBody = styled.tbody`
  tr:nth-child(odd) {
    ${tw`bg-gray-100`}
  }
`;

const Td = styled.td`
  ${tw`p-2 border border-gray-600`}
  ${(props) => {
    switch (props.align) {
      case "right":
        return tw`text-right`;
      case "center":
        return tw`text-center`;
      case "left":
      default:
        return tw`text-left`;
    }
  }}
`;

const components = {
  h1: HeaderFactory(tw.h1`text-gray-700 text-xl font-bold`),
  h2: HeaderFactory(tw.h2`text-gray-600 text-lg font-semibold`),
  h3: HeaderFactory(tw.h3`text-gray-600 text-lg font-thin`),
  h4: HeaderFactory(tw.h4`text-gray-600 font-bold`),
  h5: HeaderFactory(tw.h5`text-gray-600 font-semibold`),
  h6: HeaderFactory(tw.h6`text-gray-600 font-thin`),
  a: tw.a`text-blue-500 underline hover:text-blue-300 visited:text-purple-300`,
  blockquote: tw.blockquote`bg-gradient-to-tr from-white to-gray-200 p-10 font-thin italic`,
  ul: tw.ul`list-disc ml-6`,
  ol: tw.ol`list-decimal ml-6`,
  p: tw.p``,
  b: tw.b`font-semibold`,
  em: tw.em`font-semibold`,
  i: tw.i`italic`,
  details: tw.details``,
  summary: tw.summary``,
  hr: tw.hr``,
  sup: styled.sup`
    ${tw`text-sm`}
    a, a:hover, a:visited {
      ${tw`text-blue-500!`}
    }
  `,
  li: FootnoteOrListItem,
  del: tw.del`line-through`,
  input: tw.input`bg-green-800`,
  table: tw.table`table-auto border-collapse min-width[30vw]`,
  tbody: TBody,
  dl: tw.dl``,
  dt: tw.dt``,
  dd: tw.dd``,
  th: tw.th`font-light p-2 text-left`,
  td: Td,
  inlineCode: tw.code`font-mono bg-code-light text-code-dark pr-0.5 pl-0.5 rounded font-light`,
  code: CodeBlock,
  PostList,
  TableOfContents,
};

type TOCLinkProps = {
  tag?: string;
};

const TOCLink = styled.a<TOCLinkProps>`
  ${tw`text-blue-600 underline`}
  ${(props) => {
    switch (props.tag) {
      case "h1":
        return tw`pl-3`;
      case "h2":
        return tw`pl-6`;
      case "h3":
        return tw`pl-9`;
      default:
        return tw`pl-12`;
    }
  }}
`;

function TableOfContents() {
  const { data, fns } = useContext();

  const collectionItem = fns.getCollectionItem(data.collections.all, data.page);

  const templateContent = collectionItem.template.frontMatter.content;

  const ComponentProxy = new Proxy(components, {
    get: (_, componentName) => {
      switch (componentName) {
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
        case "h6":
          return ({ children, id }: { children: string; id?: string }) => (
            <TOCLink
              tag={componentName}
              href={id ? `#${id}` : `#${fns.slug(children)}`}
            >
              {children}
            </TOCLink>
          );
        default:
          return () => null;
      }
    },
  });

  return (
    <div tw="flex flex-col border border-gray-600 p-3">
      <h4 tw="text-gray-600">Table of contents</h4>
      <MDX scope={data} components={ComponentProxy}>
        {templateContent}
      </MDX>
    </div>
  );

  // debugger;
}

function PostList() {
  const { data } = useContext();
  return (
    <div tw="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-6">
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

  const Globo =
    data.mdxType === "jumbotron"
      ? styled.div`
          background-image: url("/img/desert.jpg");
          ${tw`min-h-screen bg-center bg-cover bg-fixed`}
        `
      : React.Fragment;

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
        <Globo>
          <NavBar />
          <div tw="container mx-auto p-2 md:p-8 min-h-full">{children}</div>
        </Globo>
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
        return <span />;
      }
      return (
        <a
          tw="text-green-200 visited:text-green-600 inline-block text-sm px-4 py-2 leading-none border rounded text-center"
          href={prev?.url}
        >
          {filter === "getPreviousCollectionItem" && (
            <span role="img" aria-label="Arrow Back">
              ←{" "}
            </span>
          )}
          {prev?.data?.title ?? "aaaaa"}
          {filter === "getNextCollectionItem" && (
            <span role="img" aria-label="Right Arrow">
              {" "}
              →
            </span>
          )}
        </a>
      );
    } catch (err) {
      return null;
    }
  };
}
const Previous = DirectionalButtonFactory("getPreviousCollectionItem");
const Next = DirectionalButtonFactory("getNextCollectionItem");

const Article = styled.article`
  & > * {
    ${tw`mb-3`}
  }
`;

export async function mdxRenderer(
  body: string,
  data: EleventyData,
  jsFunctions: Record<string, Function>
): Promise<string> {
  const simple = data?.permalink === body;
  if (simple) {
    return body;
  }

  const sheet = new ServerStyleSheet();
  let htmlBody = "";
  let collectedStyles = "";
  const Wrapper = (() => {
    switch (data.mdxType) {
      case "post":
        return Article;

      case "jumbotron":
        const J = tw.main`shadow-xl bg-white bg-opacity-80 border-gray-400 p-16 min-h-full`;
        return J;
      default:
        return tw.div``;
    }
  })();

  const PostNav = () => (
    <nav tw="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <Previous />
      <Next />
    </nav>
  );

  const isPost = data.mdxType === "post";

  try {
    htmlBody = ReactDOM.renderToStaticMarkup(
      sheet.collectStyles(
        <>
          <Context.Provider value={{ data, fns: jsFunctions } ?? null}>
            <GlobalStyles />
            <Default>
              <Wrapper id="main">
                {isPost && <h1 tw="text-3xl">{data.title}</h1>}
                <MDX scope={data} components={components}>
                  {body}
                </MDX>
              </Wrapper>
              {isPost && <PostNav />}
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

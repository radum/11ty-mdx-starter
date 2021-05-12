import React from "react";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import prismTheme from "prism-react-renderer/themes/github";
import { buildSync } from "esbuild";
import path from "path";
import { useContext } from ".";
export function Script({ children }: any) {
  const { data } = useContext();

  buildSync({
    stdin: {
      contents: children,
      resolveDir: path.resolve(path.join(__dirname, "..")),
      sourcefile: "imaginary-file.js",
      loader: "tsx",
    },
    bundle: true,
    minify: false,
    platform: "browser",
    sourcemap: false,
    target: ["chrome58", "firefox57", "safari11", "edge16"],
    outfile: (data.page as any).outputPath.replace("html", "js"),
  });

  return <script src={(data.page as any).filePathStem + ".js"} />;
}

export function CodeBlock({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const language = (
    className ? className.replace(/language-/, "") : ""
  ) as Language;

  if (children.startsWith("// execute")) {
    return <Script lang={language}>{children}</Script>;
  }
  return (
    <Highlight
      {...defaultProps}
      theme={prismTheme}
      code={children}
      language={language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: "20px" }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

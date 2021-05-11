import React from "react";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
import prismTheme from "prism-react-renderer/themes/github";

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

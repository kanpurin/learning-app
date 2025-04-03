import React from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";

const MarkdownArea = ({ text, margin = "0.5em" }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw]}
      components={{
        p: ({ children }) => (
          <p style={{ marginTop: margin, marginBottom: margin }}>{children}</p>
        ),
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: "6px solid #adb5bd",
              paddingLeft: "20px",
              color: "#495057",
              margin: "20px 0",
            }}
          >
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <table className="table table-bordered">{children}</table>
        ),
        th: ({ children }) => (
          <th className="table-primary">{children}</th>
        ),
        details: ({ children }) => <details className="mb-3">{children}</details>,
        summary: ({ children }) => <summary className="font-weight-bold">{children}</summary>,
        pre: ({ children }) => (
          <pre className="bg-dark text-light p-3 rounded">{children}</pre>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
};

export default MarkdownArea;

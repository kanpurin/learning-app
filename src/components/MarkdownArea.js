import React from 'react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

const MarkdownArea = ({ text }) => {
  return (
		<ReactMarkdown 
			remarkPlugins={[remarkGfm, remarkBreaks]}
			components={{
				blockquote: ({ children }) => (
					<blockquote style={{ borderLeft: "4px solid #ccc", paddingLeft: "10px", color: "#666" }}>
						{children}
					</blockquote>
				),
				table: ({ children }) => (
					<table style={{ borderCollapse: "collapse" }}>{children}</table>
				),
				th: ({ children }) => (
					<th style={{ border: "1px solid #ddd", padding: "8px", backgroundColor: "#f4f4f4" }}>
						{children}
					</th>
				),
				td: ({ children }) => (
					<td style={{ border: "1px solid #ddd", padding: "8px" }}>
						{children}
					</td>
				),
			}}
		>
			{text}
		</ReactMarkdown>
  );
};

export default MarkdownArea;
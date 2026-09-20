/**
 * Utilities for extracting text from LaTeX documents to minimize token usage
 * and eliminate formatting boilerplate before sending to an LLM.
 */
export function extractTextFromLatex(latex: string): string {
  if (!latex || typeof latex !== "string") return "";

  let text = latex;

  // Extract content inside \begin{document} ... \end{document}
  const documentStart = "\\begin{document}";
  const documentEnd = "\\end{document}";

  const docStartIndex = text.indexOf(documentStart);

  if (docStartIndex !== -1) {
    const contentStart = docStartIndex + documentStart.length;
    const docEndIndex = text.indexOf(documentEnd, contentStart);

    text =
      docEndIndex !== -1
        ? text.substring(contentStart, docEndIndex)
        : text.substring(contentStart);
  }

  // Remove LaTeX comments while preserving escaped percentages
  text = text.replace(/(^|[^\\])%.*$/gm, "$1");

  // Strip hyperref links: \href{url}{text} -> text (url)
  text = text.replace(/\\href\{([^{}]*)\}\{([^{}]*)\}/g, "$2 ($1)");

  // Strip URLs: \url{url} -> url
  text = text.replace(/\\url\{([^{}]*)\}/g, "$1");

  // Replace common LaTeX formatting commands with their inner text
  text = text.replace(
    /\\(?:textbf|textit|underline|emph|text|scshape|small|large|Large|Huge|huge)\{([^{}]*)\}/g,
    "$1",
  );

  // Custom resume macros
  text = text.replace(/\\resumeItem\{([^{}]*)\}/g, "• $1\n");

  text = text.replace(
    /\\resumeSubheading\{([^{}]*)\}\{([^{}]*)\}\{([^{}]*)\}\{([^{}]*)\}/g,
    "$1 | $2 | $3 | $4\n",
  );

  // Convert sections: \section{xyz} -> ## xyz
  text = text.replace(/\\section\*?\{([^{}]*)\}/g, "\n## $1\n");

  // Remove environments: \begin{...} and \end{...}
  text = text.replace(/\\(?:begin|end)\{[^{}]*\}/g, " ");

  // Remove spacing and formatting commands with arguments
  text = text.replace(
    /\\(?:vspace|hspace|addtolength|setlength)\*?\{[^{}]*\}/g,
    " ",
  );

  // Remove commands without arguments
  text = text.replace(
    /\\(?:newpage|clearpage|centering|raggedright|raggedbottom|pagestyle|fancyhf|fancyfoot)/g,
    " ",
  );

  text = text.replace(
    /\\(?:small|large|Large|Huge|huge|scshape|bfseries|itshape)/g,
    " ",
  );

  // Unescape common LaTeX characters
  text = text.replace(/\\&/g, "&");
  text = text.replace(/\\%/g, "%");
  text = text.replace(/\\\$/g, "$");
  text = text.replace(/\\#/g, "#");
  text = text.replace(/\\_/g, "_");
  text = text.replace(/\\\{/g, "{");
  text = text.replace(/\\\}/g, "}");

  // Convert LaTeX line breaks to newlines
  text = text.replace(/\\\\/g, "\n");

  // Convert LaTeX dashes
  text = text.replace(/---/g, "—");
  text = text.replace(/--/g, "–");

  // Remove remaining simple LaTeX commands
  text = text.replace(/\\[a-zA-Z]+/g, " ");

  // Normalize whitespace
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/(\r\n|\r|\n){3,}/g, "\n\n");

  return text.trim();
}

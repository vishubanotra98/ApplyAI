/**
 * Utilities for extracting text from LaTeX documents to minimize token usage
 * and eliminate formatting boilerplate before sending to LLM.
 */

export function extractTextFromLatex(latex: string): string {
  if (!latex || typeof latex !== 'string') return '';

  let text = latex;

  // If there is a \begin{document} ... \end{document}, extract only what's inside
  const docStart = text.indexOf('\\begin{document}');
  if (docStart !== -1) {
    const docEnd = text.indexOf('\\end{document}');
    if (docEnd !== -1) {
      text = text.substring(docStart + '\\begin{document}'.length, docEnd);
    } else {
      text = text.substring(docStart + '\\begin{document}'.length);
    }
  }

  // Remove LaTeX comments (% ...)
  text = text.replace(/(^|[^\\])%.*$/gm, '$1');

  // Strip hyperref links: \href{url}{text} -> text (url)
  text = text.replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '$2 ($1)');
  text = text.replace(/\\url\{([^}]+)\}/g, '$1');

  // Replace common LaTeX formatting commands with their inner text
  // e.g. \textbf{xyz}, \textit{xyz}, \underline{xyz}, \scshape, \small, \Huge
  text = text.replace(/\\(textbf|textit|underline|emph|text|scshape|small|large|Large|Huge|huge)\{([^}]*)\}/g, '$2');
  
  // Custom resume macros (resumeItem, resumeSubheading, etc.)
  text = text.replace(/\\resumeItem\{([^}]*)\}/g, '• $1\n');
  text = text.replace(/\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g, '$1 | $2 | $3 | $4\n');

  // Remove sections markers: \section{xyz} -> \n## xyz\n
  text = text.replace(/\\section\*?\{([^}]*)\}/g, '\n## $1\n');

  // Remove environments \begin{...} and \end{...}
  text = text.replace(/\\(begin|end)\{[^}]*\}/g, ' ');

  // Remove common spacing & formatting commands
  text = text.replace(/\\(vspace|hspace|addtolength|setlength)\*?\{[^}]*\}/g, ' ');
  text = text.replace(/\\(newpage|clearpage|centering|raggedright|raggedbottom|pagestyle|fancyhf|fancyfoot)/g, ' ');
  text = text.replace(/\\(small|large|Large|Huge|huge|scshape|bfseries|itshape)/g, ' ');

  // Unescape common LaTeX characters
  text = text.replace(/\\&/g, '&');
  text = text.replace(/\\%/g, '%');
  text = text.replace(/\\\$/g, '$');
  text = text.replace(/\\#/g, '#');
  text = text.replace(/\\_/g, '_');
  text = text.replace(/\\\{/g, '{');
  text = text.replace(/\\\}/g, '}');
  text = text.replace(/\\\\/g, '\n');
  text = text.replace(/---/g, '—');
  text = text.replace(/--/g, '–');

  // Strip other leftover backslash commands \command
  text = text.replace(/\\[a-zA-Z]+/g, ' ');

  // Clean multiple blank lines and redundant spaces
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/(\r\n|\r|\n){3,}/g, '\n\n');

  return text.trim();
}

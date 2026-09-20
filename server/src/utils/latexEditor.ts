import { AppError } from "./errors.js";

type RewriteOperation = {
  section: string;
  originalText: string;
  replacementText: string;
  reason: string;
};

type PruneOperation = {
  section: string;
  targetText: string;
  reason: string;
};

type EditPlan = {
  rewrites: RewriteOperation[];
  reorders: unknown[];
  emphasis: unknown[];
  prunes: PruneOperation[];
};

const FORBIDDEN_STRUCTURE_PATTERNS = [
  "\\documentclass",
  "\\usepackage",
  "\\begin{document}",
  "\\end{document}",
];

function assertSafeReplacement(text: string): void {
  for (const forbiddenPattern of FORBIDDEN_STRUCTURE_PATTERNS) {
    if (text.includes(forbiddenPattern)) {
      throw new AppError(
        422,
        "The AI attempted to modify the LaTeX document structure.",
      );
    }
  }
}

function replaceExactText(
  latex: string,
  originalText: string,
  replacementText: string,
): string {
  if (!originalText.trim()) {
    throw new AppError(422, "An edit instruction contained empty source text.");
  }

  const occurrences = latex.split(originalText).length - 1;

  if (occurrences === 0) {
    throw new AppError(
      422,
      `Could not find the requested text in the master resume: "${originalText}"`,
    );
  }

  if (occurrences > 1) {
    throw new AppError(
      422,
      `The requested text appears multiple times in the master resume: "${originalText}"`,
    );
  }

  assertSafeReplacement(replacementText);

  return latex.replace(originalText, replacementText);
}

export function applyEditPlan(masterLatex: string, editPlan: EditPlan): string {
  let updatedLatex = masterLatex;

  // Apply exact text rewrites.
  for (const rewrite of editPlan.rewrites ?? []) {
    updatedLatex = replaceExactText(
      updatedLatex,
      rewrite.originalText,
      rewrite.replacementText,
    );
  }

  // Remove only exact text blocks.
  for (const prune of editPlan.prunes ?? []) {
    updatedLatex = replaceExactText(updatedLatex, prune.targetText, "");
  }

  // Reordering and emphasis are not applied yet.
  return updatedLatex;
}

export type NotebookGuideStatus = "current" | "demo-only" | "legacy" | "risky";

export type NotebookGuideReference = {
  id: string;
  title: string;
  publisher: string;
  href: string;
  reviewedAt: string;
};

export type NotebookGuidePoint = {
  title: string;
  what: string;
  why: string;
  bestPractices: string[];
  warnings: string[];
  status: NotebookGuideStatus;
  referenceIds: string[];
};

export type NotebookCellGuide = {
  points: NotebookGuidePoint[];
  prerequisites: string[];
  expectedEvidence: string[];
};

export type NotebookGuideCell = {
  sourceIndex: number;
  sourceDigest: string;
  guide: NotebookCellGuide;
};

export type NotebookGuideManifest = {
  resourceId: string;
  upstreamRef: string;
  path: string;
  reviewedAt: string;
  references: NotebookGuideReference[];
  cells: NotebookGuideCell[];
};

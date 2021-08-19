
export interface PanelSettings {
  seo: SEO;
  slug: Slug;
  tags: string[];
  categories: string[];
  freeform: boolean;
  scripts: CustomScript[];
  isInitialized: boolean;
  modifiedDateUpdate: boolean;
  contentInfo: FolderInfo[] | null;
  writingSettingsEnabled: boolean;
  fmHighlighting: boolean;
  preview: PreviewSettings;
}

export interface SEO {
  title: number;
  description: number;
  content: number;
  descriptionField: string;
}

export interface Slug {
  prefix: number;
  suffix: number;
}

export interface FolderInfo {
  title: string;
  files: number;
}

export interface CustomScript {
  title: string;
  script: string;
  nodeBin?: string;
}

export interface PreviewSettings {
  host: string | undefined;
  pathname: string | undefined;
}
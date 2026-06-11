export type DisplayLocale = "zh" | "zhHant" | "en" | "ja" | "ko";

export interface GuideSection {
  title: string;
  body: string;
  links?: string[];
  showDemo?: boolean;
}

export interface HomeCopy {
  title: string;
  description: string;
  placeholder: string;
  upload: string;
  generate: string;
  fileHint: string;
  selectedFiles: (count: number) => string;
  projects: string;
  projectTitle: string;
  projectDesc: string;
  settings: string;
  language: string;
  guide: string;
  guideTitle: string;
  guideSubtitle: string;
  loading: string;
  recent: string;
  unopened: string;
  projectNamePrefix: string;
  sections: GuideSection[];
}

export interface LocaleOption {
  id: DisplayLocale;
  label: string;
}

export interface ProjectMockVariant {
  screen: string;
  blocks: string[];
}

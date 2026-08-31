export type ProductType = 'Award' | 'Decoration';

export type FormFormat =
  | 'AF Form 1206'
  | 'citation'
  | 'WMA Form 15'
  | 'Joint'
  | 'Other';

export type BoardLevel =
  | 'Squadron'
  | 'Wing'
  | 'MAJCOM'
  | 'Joint'
  | 'DAF'
  | 'Other';

export interface SetupFormData {
  // Required for drafting
  productType: ProductType | '';
  awardName: string;
  formFormat: FormFormat | string;
  rankGrade: string;
  afscDutyArea: string;
  targetBoardLevel: BoardLevel | string;
  limitValue: string; // Line or character count target

  // Optional
  name: string;
  dutyTitle: string;
  unit: string;
  inclusiveDates: string;
  priorPackages: string;
  localGuidance: string;
  rawNotes: string;
  revisionInstructions: string;
}

export interface DraftSection {
  id: string;
  title: string;
  description?: string;
  maxLimit?: string;
  content: string;
  bullets: string[];
  charCount?: number;
  previousContent?: string; // For before/after diff tracking
}

export interface IssueItem {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
}

export interface PackageHeader {
  productType: string;
  awardName: string;
  formFormat: string;
  rankGrade: string;
  afscDutyArea?: string;
  targetBoardLevel: string;
  limitValue: string;
  candidateInfo?: string;
}

export interface GeneratedPackage {
  isHardGated: boolean;
  hardGateNotice?: string;
  progressionWarning?: string;
  packageHeader: PackageHeader;
  sections: DraftSection[];
  issuesList: IssueItem[];
  gapsIdentified?: string[];
  nextSteps: string[];
  lastGeneratedAt?: string;
  isImproved?: boolean;
}

export interface MurderboardRubricItem {
  category: string;
  score: number;
  verdict: string;
  critique: string;
}

export interface MurderboardQuestion {
  targetBullet: string;
  challengeQuestion: string;
  vulnerability: string;
}

export interface MurderboardResult {
  overallScore: number;
  overallAssessment: string;
  scoringRubric: MurderboardRubricItem[];
  boardQuestions: MurderboardQuestion[];
  recommendations: string[];
}

export interface SavedDraft {
  id: string;
  title: string;
  updatedAt: string;
  formData: SetupFormData;
  generatedPackage?: GeneratedPackage | null;
}

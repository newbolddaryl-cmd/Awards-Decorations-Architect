import { SetupFormData, GeneratedPackage, SavedDraft } from '../types';

const STORAGE_KEY = 'awards_architect_drafts_v1';
const ACTIVE_DRAFT_KEY = 'awards_architect_active_form_v1';

export function getSavedDrafts(): SavedDraft[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse saved drafts from localStorage', e);
    return [];
  }
}

export function saveDraft(
  title: string,
  formData: SetupFormData,
  generatedPackage: GeneratedPackage | null = null,
  existingId?: string
): SavedDraft {
  const drafts = getSavedDrafts();
  const id = existingId || 'draft_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
  const now = new Date().toISOString();

  const newDraft: SavedDraft = {
    id,
    title: title || formData.awardName || 'Untitled Award Draft',
    updatedAt: now,
    formData,
    generatedPackage,
  };

  const existingIndex = drafts.findIndex((d) => d.id === id);
  if (existingIndex >= 0) {
    drafts[existingIndex] = newDraft;
  } else {
    drafts.unshift(newDraft);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.error('Failed to save draft to localStorage', e);
  }

  return newDraft;
}

export function deleteDraft(id: string): SavedDraft[] {
  const drafts = getSavedDrafts().filter((d) => d.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.error('Failed to delete draft from localStorage', e);
  }
  return drafts;
}

export function saveActiveFormState(formData: SetupFormData) {
  try {
    localStorage.setItem(ACTIVE_DRAFT_KEY, JSON.stringify(formData));
  } catch (e) {
    console.error('Failed to persist active form state', e);
  }
}

export function getActiveFormState(): SetupFormData | null {
  try {
    const raw = localStorage.getItem(ACTIVE_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

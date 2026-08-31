import React, { useState, useEffect } from 'react';
import {
  Shield,
  Medal,
  Award,
  FolderClock,
  Sparkles,
  AlertCircle,
  FileCheck2,
  Lock,
  RotateCcw
} from 'lucide-react';
import {
  SetupFormData,
  GeneratedPackage,
  SavedDraft,
  MurderboardResult
} from './types';
import { PrivacyBanner } from './components/PrivacyBanner';
import { SetupScreen } from './components/SetupScreen';
import { WorkspaceScreen } from './components/WorkspaceScreen';
import { MurderboardModal } from './components/MurderboardModal';
import { SavedDraftsDrawer } from './components/SavedDraftsDrawer';
import {
  getSavedDrafts,
  saveDraft,
  deleteDraft,
  saveActiveFormState,
  getActiveFormState
} from './utils/storage';
import { scanForSensitiveData } from './utils/sanitizer';

const DEFAULT_FORM_DATA: SetupFormData = {
  productType: 'Award',
  awardName: '',
  formFormat: 'AF Form 1206',
  rankGrade: '',
  afscDutyArea: '',
  targetBoardLevel: 'Wing',
  limitValue: '13 Lines',
  name: '',
  dutyTitle: '',
  unit: '',
  inclusiveDates: '',
  priorPackages: '',
  localGuidance: '',
  rawNotes: '',
  revisionInstructions: '',
};

// Helper for robust API requests with timeout and network diagnostics
async function callBackendApi<T>(url: string, body: any): Promise<T> {
  const maxAttempts = 2;
  let lastErr: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timer);

      let responseData: any;
      const text = await response.text();
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { message: text || `Server returned status ${response.status}` };
      }

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Request failed with status ${response.status}`);
      }

      return responseData as T;
    } catch (err: any) {
      clearTimeout(timer);
      lastErr = err;

      const isNetworkOrTimeout =
        err.name === 'AbortError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError');

      if (isNetworkOrTimeout && attempt < maxAttempts) {
        // Wait 800ms and retry once automatically for transient network blips
        await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }
      break;
    }
  }

  if (lastErr?.name === 'AbortError') {
    throw new Error('The request timed out while generating. The server may be processing heavy load; please click Retry.');
  }
  if (lastErr?.message?.includes('Failed to fetch')) {
    throw new Error('Connection to the server was temporarily lost. Please check your connection and click Retry.');
  }

  throw lastErr;
}

export default function App() {
  const [formData, setFormData] = useState<SetupFormData>(() => {
    return getActiveFormState() || DEFAULT_FORM_DATA;
  });
  const [packageData, setPackageData] = useState<GeneratedPackage | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'setup' | 'workspace'>('setup');
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isMurderboardLoading, setIsMurderboardLoading] = useState(false);
  const [murderboardResult, setMurderboardResult] = useState<MurderboardResult | null>(null);
  const [isMurderboardOpen, setIsMurderboardOpen] = useState(false);

  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [isDraftsDrawerOpen, setIsDraftsDrawerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null);

  // Load saved drafts on mount
  useEffect(() => {
    setSavedDrafts(getSavedDrafts());
  }, []);

  // Save active form changes to local state
  useEffect(() => {
    saveActiveFormState(formData);
  }, [formData]);

  // Handle Generate
  const handleGenerate = async () => {
    setErrorMessage(null);
    setLastFailedAction(null);

    // Client-side sensitive data pre-check
    const combinedNotes = `${formData.rawNotes} ${formData.priorPackages} ${formData.localGuidance} ${formData.revisionInstructions}`;
    const scan = scanForSensitiveData(combinedNotes);
    if (scan.hasSensitiveData) {
      setErrorMessage(
        `Input contains prohibited or sensitive information (${scan.description}). Please sanitize your notes before generating.`
      );
      return;
    }

    setIsGenerating(true);
    try {
      const data = await callBackendApi<GeneratedPackage>('/api/generate', formData);

      setPackageData(data);
      setCurrentScreen('workspace');

      // Auto-save generated draft to local storage
      const saved = saveDraft(formData.awardName || 'New Package', formData, data, activeDraftId);
      setActiveDraftId(saved.id);
      setSavedDrafts(getSavedDrafts());
    } catch (err: any) {
      console.error('Generation failure:', err);
      setErrorMessage(err.message || 'Failed to generate package. Please try again.');
      setLastFailedAction(() => handleGenerate);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Improve
  const handleImprove = async () => {
    if (!packageData) return;
    setErrorMessage(null);
    setLastFailedAction(null);

    const combinedNotes = `${formData.rawNotes} ${formData.revisionInstructions}`;
    const scan = scanForSensitiveData(combinedNotes);
    if (scan.hasSensitiveData) {
      setErrorMessage(
        `Input contains prohibited or sensitive information (${scan.description}). Please sanitize your notes before improving.`
      );
      return;
    }

    setIsImproving(true);
    try {
      const data = await callBackendApi<any>('/api/improve', {
        currentDraft: packageData.sections,
        rawNotes: formData.rawNotes,
        revisionInstructions: formData.revisionInstructions,
        packageHeader: packageData.packageHeader,
        priorPackages: formData.priorPackages,
        localGuidance: formData.localGuidance,
      });

      // Preserve previousContent in each section for before/after comparison
      const previousMap = new Map<string, string>();
      packageData.sections.forEach((s) => {
        previousMap.set(s.id, s.content);
      });

      const updatedSections = data.sections.map((newSec: any) => ({
        ...newSec,
        previousContent: previousMap.get(newSec.id) || '',
      }));

      const improvedPackage: GeneratedPackage = {
        ...data,
        sections: updatedSections,
        isImproved: true,
        lastGeneratedAt: new Date().toISOString(),
      };

      setPackageData(improvedPackage);

      // Save updated draft
      const saved = saveDraft(formData.awardName, formData, improvedPackage, activeDraftId);
      setActiveDraftId(saved.id);
      setSavedDrafts(getSavedDrafts());
    } catch (err: any) {
      console.error('Improvement error:', err);
      setErrorMessage(err.message || 'Failed to improve package.');
      setLastFailedAction(() => handleImprove);
    } finally {
      setIsImproving(false);
    }
  };

  // Handle Murderboard
  const handleMurderboard = async () => {
    if (!packageData) return;
    setErrorMessage(null);
    setLastFailedAction(null);
    setIsMurderboardOpen(true);
    setIsMurderboardLoading(true);

    try {
      const data = await callBackendApi<MurderboardResult>('/api/murderboard', {
        packageHeader: packageData.packageHeader,
        sections: packageData.sections,
        rawNotes: formData.rawNotes,
        priorPackages: formData.priorPackages,
      });

      setMurderboardResult(data);
    } catch (err: any) {
      console.error('Murderboard failure:', err);
      setErrorMessage(err.message || 'Failed to run murderboard review.');
      setLastFailedAction(() => handleMurderboard);
    } finally {
      setIsMurderboardLoading(false);
    }
  };

  // Load Saved Draft
  const handleLoadDraft = (draft: SavedDraft) => {
    setFormData(draft.formData);
    setActiveDraftId(draft.id);
    if (draft.generatedPackage) {
      setPackageData(draft.generatedPackage);
      setCurrentScreen('workspace');
    } else {
      setCurrentScreen('setup');
    }
  };

  // Delete Draft
  const handleDeleteDraft = (id: string) => {
    const updated = deleteDraft(id);
    setSavedDrafts(updated);
    if (activeDraftId === id) {
      setActiveDraftId(undefined);
    }
  };

  // Start fresh
  const handleNewPackage = () => {
    setFormData(DEFAULT_FORM_DATA);
    setPackageData(null);
    setActiveDraftId(undefined);
    setCurrentScreen('setup');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner (Classified / PII / PHI Guard) */}
      <PrivacyBanner />

      {/* Main Navbar */}
      <nav className="bg-[#1E293B] text-white px-4 sm:px-6 py-2.5 flex justify-between items-center shadow-sm z-20">
        <div
          onClick={() => setCurrentScreen('setup')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-6 h-6 bg-amber-400 rounded-sm flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-[#1E293B] font-black text-xs tracking-tighter">AA</span>
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              AWARDS ARCHITECT
              <span className="text-[10px] font-mono opacity-60 font-normal">v32.0</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider">
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
              Engine Ready
            </span>
            <span className="text-slate-400 opacity-70">Local Storage Active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDraftsDrawerOpen(true)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1.5 cursor-pointer uppercase transition-colors"
            >
              <FolderClock className="w-3.5 h-3.5 text-amber-400" />
              <span>Drafts ({savedDrafts.length})</span>
            </button>

            {currentScreen === 'workspace' && (
              <button
                type="button"
                onClick={() => setCurrentScreen('setup')}
                className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-800 text-xs font-bold text-white uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Setup</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Error alert toast */}
      {errorMessage && (
        <div className="max-w-5xl mx-auto px-4 mt-3 w-full">
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm text-xs">
            <div className="flex items-start gap-2.5 flex-1">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-900 uppercase tracking-wider block">Notice</span>
                <p className="mt-0.5 text-slate-700">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {lastFailedAction && (
                <button
                  type="button"
                  onClick={() => {
                    const action = lastFailedAction;
                    setErrorMessage(null);
                    setLastFailedAction(null);
                    action();
                  }}
                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] uppercase tracking-wider cursor-pointer shadow-xs transition-colors"
                >
                  Retry Now
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setLastFailedAction(null);
                }}
                className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 underline font-bold uppercase cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 flex flex-col">
        {currentScreen === 'setup' || !packageData ? (
          <SetupScreen
            formData={formData}
            setFormData={setFormData}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onOpenDrafts={() => setIsDraftsDrawerOpen(true)}
            savedDraftsCount={savedDrafts.length}
          />
        ) : (
          <WorkspaceScreen
            packageData={packageData}
            setPackageData={setPackageData}
            formData={formData}
            setFormData={setFormData}
            onImprove={handleImprove}
            isImproving={isImproving}
            onMurderboard={handleMurderboard}
            onBackToSetup={() => setCurrentScreen('setup')}
          />
        )}
      </main>

      {/* Murderboard Critique Modal */}
      <MurderboardModal
        isOpen={isMurderboardOpen}
        onClose={() => setIsMurderboardOpen(false)}
        result={murderboardResult}
        isLoading={isMurderboardLoading}
        awardName={packageData?.packageHeader.awardName || formData.awardName}
      />

      {/* Saved Drafts Drawer */}
      <SavedDraftsDrawer
        isOpen={isDraftsDrawerOpen}
        onClose={() => setIsDraftsDrawerOpen(false)}
        drafts={savedDrafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={handleDeleteDraft}
        onNewPackage={handleNewPackage}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-medium gap-2">
        <div>Awards Architect General Edition v32.0.0-PROD</div>
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Session Security: Private / Client-Side Device Sandbox Only</span>
        </div>
      </footer>
    </div>
  );
}

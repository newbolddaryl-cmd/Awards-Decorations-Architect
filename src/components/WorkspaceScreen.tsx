import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Target,
  Copy,
  Check,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Clock,
  Edit3,
  CheckCircle2,
  AlertOctagon,
  ChevronRight,
  ChevronDown,
  Info,
  Layers,
  History,
  Maximize2,
  Minimize2,
  ShieldAlert,
  Send
} from 'lucide-react';
import {
  GeneratedPackage,
  SetupFormData,
  DraftSection,
  IssueItem
} from '../types';
import { scanForSensitiveData } from '../utils/sanitizer';

interface WorkspaceScreenProps {
  packageData: GeneratedPackage;
  setPackageData: React.Dispatch<React.SetStateAction<GeneratedPackage | null>>;
  formData: SetupFormData;
  setFormData: React.Dispatch<React.SetStateAction<SetupFormData>>;
  onImprove: () => void;
  isImproving: boolean;
  onMurderboard: () => void;
  onBackToSetup: () => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  packageData,
  setPackageData,
  formData,
  setFormData,
  onImprove,
  isImproving,
  onMurderboard,
  onBackToSetup,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(
    packageData.sections[0]?.id || ''
  );
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [showDiffSectionId, setShowDiffSectionId] = useState<string | null>(null);
  const [showNotesPanel, setShowNotesPanel] = useState(true);

  // Sync active section when sections change
  useEffect(() => {
    if (!activeSectionId && packageData.sections.length > 0) {
      setActiveSectionId(packageData.sections[0].id);
    }
  }, [packageData.sections, activeSectionId]);

  const activeSection =
    packageData.sections.find((s) => s.id === activeSectionId) ||
    packageData.sections[0];

  // Live edit section content
  const handleSectionContentChange = (id: string, newContent: string) => {
    const updatedSections = packageData.sections.map((sec) => {
      if (sec.id === id) {
        // Split into bullets if line breaks exist
        const bullets = newContent
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean);
        return {
          ...sec,
          content: newContent,
          bullets: bullets.length > 0 ? bullets : [newContent],
          charCount: newContent.length,
        };
      }
      return sec;
    });

    setPackageData({
      ...packageData,
      sections: updatedSections,
    });
  };

  // Copy Single Section
  const handleCopySection = (section: DraftSection) => {
    const textToCopy = `${section.title.toUpperCase()}\n${section.content}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedSectionId(section.id);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  // Copy All Sections Formatted
  const handleCopyAll = () => {
    const headerLines = [
      `AWARD / DECORATION: ${packageData.packageHeader.awardName}`,
      `FORM / FORMAT: ${packageData.packageHeader.formFormat}`,
      `RANK / GRADE: ${packageData.packageHeader.rankGrade}`,
      `TARGET BOARD LEVEL: ${packageData.packageHeader.targetBoardLevel}`,
      `TARGET LIMIT: ${packageData.packageHeader.limitValue}`,
      formData.name ? `NOMINEE: ${formData.name}` : '',
      formData.unit ? `UNIT: ${formData.unit}` : '',
      formData.inclusiveDates ? `INCLUSIVE DATES: ${formData.inclusiveDates}` : '',
      '--------------------------------------------------',
    ]
      .filter(Boolean)
      .join('\n');

    const sectionsText = packageData.sections
      .map((sec) => `[${sec.title.toUpperCase()}]\n${sec.content}`)
      .join('\n\n');

    const fullPackageText = `${headerLines}\n\n${sectionsText}`;
    navigator.clipboard.writeText(fullPackageText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Calculate target numerical limit for character progress bar
  const parseTargetLimitNumber = (limitStr: string): number => {
    if (!limitStr) return 1000;
    const match = limitStr.match(/\d+/);
    if (!match) return 1000;
    const num = parseInt(match[0], 10);
    // If it's lines (e.g. 13 lines, approx 115 chars per 1206 bullet line ~ 1500 chars total)
    if (limitStr.toLowerCase().includes('line')) {
      return num * 115; // standard Air Force Form 1206 line width in pica font is ~110-120 chars
    }
    return num;
  };

  const sensitiveCheck = scanForSensitiveData(
    `${formData.rawNotes} ${formData.revisionInstructions}`
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Top Navigation & Action Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 sm:px-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToSetup}
            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer transition-colors"
            title="Edit Setup Parameters"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold uppercase">
                {packageData.packageHeader.productType || 'Draft'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold uppercase">
                {packageData.packageHeader.formFormat}
              </span>
              {packageData.isImproved && (
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase">
                  Improved
                </span>
              )}
            </div>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight truncate max-w-md sm:max-w-xl mt-0.5">
              {packageData.packageHeader.awardName || 'Board Package Workspace'}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={() => handleCopySection(activeSection)}
            className="px-2.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            {copiedSectionId === activeSection?.id ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-slate-500" />
            )}
            {copiedSectionId === activeSection?.id ? 'Section Copied' : 'Copy section'}
          </button>

          <button
            type="button"
            onClick={handleCopyAll}
            className="px-2.5 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            {copiedAll ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-slate-500" />
            )}
            {copiedAll ? 'Package Copied' : 'Copy all'}
          </button>

          <button
            type="button"
            onClick={onMurderboard}
            className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Target className="w-3.5 h-3.5 text-slate-900" />
            Murderboard
          </button>

          <button
            type="button"
            onClick={onImprove}
            disabled={isImproving || sensitiveCheck.hasSensitiveData}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {isImproving ? 'Improving...' : 'Improve Draft'}
          </button>
        </div>
      </div>

      {/* Package Header Summary Card */}
      <div className="bg-white border border-slate-200 rounded p-3.5 shadow-sm space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Package Specification Header
            </h2>
          </div>
          <div className="text-[11px] text-slate-600 font-mono flex items-center gap-2">
            <span>Rank: <strong className="text-slate-900">{packageData.packageHeader.rankGrade || 'N/A'}</strong></span>
            <span>•</span>
            <span>Board Level: <strong className="text-slate-900">{packageData.packageHeader.targetBoardLevel}</strong></span>
            <span>•</span>
            <span>Target Limit: <strong className="text-blue-700 font-bold">{packageData.packageHeader.limitValue}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Nominee</span>
            <span className="font-semibold text-slate-900">{formData.name || 'Omitted'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Duty Title</span>
            <span className="font-semibold text-slate-900">{formData.dutyTitle || 'Omitted'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">AFSC / Duty Area</span>
            <span className="font-semibold text-slate-900">{formData.afscDutyArea || 'Omitted'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 block">Unit & Dates</span>
            <span className="font-semibold text-slate-900">
              {formData.unit || 'N/A'} {formData.inclusiveDates ? `(${formData.inclusiveDates})` : ''}
            </span>
          </div>
        </div>

        {/* Hard gate callout if active */}
        {packageData.isHardGated && (
          <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-950 font-bold uppercase tracking-wide">Hard Gate Enforced: Preliminary Organization Only</strong>
              <span>
                {packageData.hardGateNotice ||
                  'Critical required fields are missing. Return to setup to complete all required parameters before final bullets can be drafted.'}
              </span>
            </div>
          </div>
        )}

        {/* Progression assessment callout */}
        {!formData.priorPackages.trim() && (
          <div className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-mono text-[11px] text-amber-800">
              Notice: Progression assessment is degraded without prior packages.
            </span>
          </div>
        )}
      </div>

      {/* Main Grid: Left Column = Persistent Raw Notes / Revision Instructions, Right Column = Draft Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT / PERSISTENT PANEL: Raw notes / revision instructions */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3 lg:sticky lg:top-16">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Raw Notes & Revisions
              </h2>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase text-slate-400">
              Syncing to Local Buffer
            </span>
          </div>

          {/* Sensitive Alert inside box */}
          {sensitiveCheck.hasSensitiveData && (
            <div className="p-2 rounded bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-[11px]">
                Sanitize notes: Prohibited data ({sensitiveCheck.description}) detected.
              </p>
            </div>
          )}

          {/* Revision Instructions for Improve */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Revision Instructions</span>
              <span className="text-[10px] font-normal text-slate-500 lowercase">
                (for Improve button)
              </span>
            </label>
            <textarea
              rows={3}
              value={formData.revisionInstructions}
              onChange={(e) =>
                setFormData({ ...formData, revisionInstructions: e.target.value })
              }
              placeholder="e.g. Cut 20 characters in section 1; sharpen impact on Wing mission; verify causal links..."
              className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            />
          </div>

          {/* Raw Accomplishments */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Raw Notes / Accomplishments
              </label>
              <span className="text-[10px] font-mono text-slate-500">
                {formData.rawNotes.length} chars
              </span>
            </div>
            <textarea
              rows={8}
              value={formData.rawNotes}
              onChange={(e) =>
                setFormData({ ...formData, rawNotes: e.target.value })
              }
              placeholder="Keep your raw notes here. Edit or add newly verified metrics at any time..."
              className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono leading-relaxed"
            />
          </div>

          {/* Quick Guidance Trigger for Improve */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span className="text-[11px]">Ready to re-architect?</span>
            <button
              type="button"
              onClick={onImprove}
              disabled={isImproving || sensitiveCheck.hasSensitiveData}
              className="text-xs font-bold uppercase text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {isImproving ? 'Improving...' : 'Run Improve Draft'}
            </button>
          </div>
        </div>

        {/* RIGHT / MAIN COLUMN: Organized sections matching selected form & rewritten bullets */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section Selector Tabs */}
          {packageData.sections.length > 1 && (
            <div className="flex overflow-x-auto pb-1 gap-1 border-b border-slate-200">
              {packageData.sections.map((section, idx) => (
                <button
                  key={section.id || idx}
                  onClick={() => setActiveSectionId(section.id)}
                  className={`px-3 py-1.5 rounded-t text-xs font-bold uppercase whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors ${
                    activeSection?.id === section.id
                      ? 'bg-white text-blue-700 border-t-2 border-blue-700 border-x border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3 h-3 text-slate-400" />
                  <span>{section.title}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-600">
                    {section.content.length}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Active Section Draft Card */}
          {activeSection && (
            <div className="bg-white border border-slate-200 rounded p-4 sm:p-5 shadow-sm space-y-4 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-blue-700 font-bold block">
                    Form Section Draft
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 uppercase mt-0.5">
                    {activeSection.title}
                  </h3>
                  {activeSection.description && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeSection.description}
                    </p>
                  )}
                </div>

                {/* Live Count per Section */}
                <div className="p-2 rounded bg-slate-50 border border-slate-200 shrink-0 flex flex-col items-end min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-mono">Count:</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {activeSection.content.length}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/</span>
                    <span className="text-xs text-blue-700 font-mono font-bold">
                      {packageData.packageHeader.limitValue}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">
                    All visible chars + spaces
                  </span>
                </div>
              </div>

              {/* Editable Section Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    Draft Text (Editable)
                  </label>
                  {activeSection.previousContent && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowDiffSectionId(
                          showDiffSectionId === activeSection.id ? null : activeSection.id
                        )
                      }
                      className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      {showDiffSectionId === activeSection.id ? 'Hide Before / After' : 'View Before / After'}
                    </button>
                  )}
                </div>

                <textarea
                  rows={8}
                  value={activeSection.content}
                  onChange={(e) =>
                    handleSectionContentChange(activeSection.id, e.target.value)
                  }
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 rounded p-3 text-xs text-slate-900 font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-blue-600"
                />

                {/* Helper notice for metrics tags */}
                {(activeSection.content.includes('[INSERT METRIC]') ||
                  activeSection.content.includes('[VALIDATE IMPACT]')) && (
                  <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-[11px]">
                      Missing metric tags identified (<code className="bg-amber-100 px-1 py-0.5 rounded font-bold text-amber-900">[INSERT METRIC]</code> or <code className="bg-amber-100 px-1 py-0.5 rounded font-bold text-amber-900">[VALIDATE IMPACT]</code>). Replace them with verified numbers before board submission.
                    </span>
                  </div>
                )}
              </div>

              {/* Before / After Diff Box */}
              {activeSection.previousContent && showDiffSectionId === activeSection.id && (
                <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700">
                    <History className="w-3.5 h-3.5 text-blue-600" />
                    Before & After Comparison (Improvement Cycle)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-900 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-red-700 block font-sans">
                        Previous Draft:
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed text-[11px]">
                        {activeSection.previousContent}
                      </p>
                      <div className="text-[10px] text-red-600/80 pt-1 font-sans">
                        Count: {activeSection.previousContent.length} chars
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-700 block font-sans">
                        Revised Draft:
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed text-[11px]">
                        {activeSection.content}
                      </p>
                      <div className="text-[10px] text-emerald-600/80 pt-1 font-sans">
                        Count: {activeSection.content.length} chars
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gaps Identified */}
          {packageData.gapsIdentified && packageData.gapsIdentified.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4 space-y-2 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Information Gaps Identified by Architect
              </h3>
              <ul className="space-y-1 list-disc pl-5 text-xs text-amber-800">
                {packageData.gapsIdentified.map((gap, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Short Issues List Under the Draft */}
          <div className="bg-white border border-slate-200 rounded p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5 text-blue-600" />
                Draft Issues & Vulnerabilities
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                {packageData.issuesList.length} items flagged
              </span>
            </div>

            {packageData.issuesList.length === 0 ? (
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>No critical causal or metric defects detected in current draft.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {packageData.issuesList.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs"
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 uppercase ${
                        issue.severity === 'HIGH'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : issue.severity === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800 block text-[11px]">
                        {issue.category}
                      </span>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next Steps & Progression Context Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded p-4 space-y-2 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Next Steps for Submission
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {packageData.nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-relaxed text-[11px]">
                    <span className="text-emerald-600 font-bold shrink-0 font-mono">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">
                Progression Context
              </h3>
              <p className="text-xs text-blue-900 leading-relaxed">
                {formData.priorPackages.trim()
                  ? 'Historical baseline detected. Current package builds on previous leadership scope and avoids lateral task duplication.'
                  : 'No previous EPBs or award packages detected. Current draft emphasizes technical execution over strategic leadership. Consider adding MAJCOM-level project oversight to improve competitiveness.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

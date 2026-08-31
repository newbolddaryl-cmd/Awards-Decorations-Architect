import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  AlertTriangle,
  FileText,
  Medal,
  Award,
  HelpCircle,
  FolderClock,
  CheckCircle2,
  ChevronDown,
  ShieldAlert,
  BookOpen
} from 'lucide-react';
import { SetupFormData, FormFormat, BoardLevel, ProductType } from '../types';
import { scanForSensitiveData } from '../utils/sanitizer';

interface SetupScreenProps {
  formData: SetupFormData;
  setFormData: React.Dispatch<React.SetStateAction<SetupFormData>>;
  onGenerate: () => void;
  isGenerating: boolean;
  onOpenDrafts: () => void;
  savedDraftsCount: number;
}

const COMMON_RANKS = [
  'AB', 'Amn', 'A1C', 'SrA', 'SSgt', 'TSgt', 'MSgt', 'SMSgt', 'CMSgt',
  '2d Lt', '1st Lt', 'Capt', 'Maj', 'Lt Col', 'Col', 'Civ / GS'
];

const COMMON_AWARDS = [
  'AF Form 1206 (Quarterly Award)',
  'AF Form 1206 (Annual Award)',
  'Meritorious Service Medal (MSM)',
  'Air and Space Commendation Medal (AFCM)',
  'Air and Space Achievement Medal (AFAM)',
  'Outstanding Airman of the Year (OAY)',
  'Defense Meritorious Service Medal (DMSM)',
  'WMA Form 15 Annual',
  'Joint Service Commendation Medal'
];

const LIMIT_PRESETS = [
  { label: '13 Lines (1206 Qtr)', value: '13 Lines' },
  { label: '24 Lines (1206 Annual)', value: '24 Lines' },
  { label: '30 Lines (1206 Annual)', value: '30 Lines' },
  { label: '1,500 Chars (MSM/AFCM)', value: '1500 Characters' },
  { label: '14 Lines (Citation)', value: '14 Lines' },
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  formData,
  setFormData,
  onGenerate,
  isGenerating,
  onOpenDrafts,
  savedDraftsCount,
}) => {
  const [showLimitHelp, setShowLimitHelp] = useState(false);

  // Check hard gate requirements
  const isProductTypeMissing = !formData.productType;
  const isAwardNameMissing = !formData.awardName.trim();
  const isFormFormatMissing = !formData.formFormat.trim();
  const isRankGradeMissing = !formData.rankGrade.trim();
  const isLimitMissing = !formData.limitValue.trim();

  const isHardGated =
    isProductTypeMissing ||
    isAwardNameMissing ||
    isFormFormatMissing ||
    isRankGradeMissing ||
    isLimitMissing;

  const missingFields: string[] = [];
  if (isProductTypeMissing) missingFields.push('Product Type');
  if (isAwardNameMissing) missingFields.push('Award / Dec Name');
  if (isFormFormatMissing) missingFields.push('Form / Format');
  if (isRankGradeMissing) missingFields.push('Rank / Grade');
  if (isLimitMissing) missingFields.push('Line/Char Limit');

  // Real-time scan for sensitive content in raw notes or text inputs
  const combinedText = `${formData.rawNotes} ${formData.priorPackages} ${formData.localGuidance}`;
  const sensitiveCheck = scanForSensitiveData(combinedText);

  const handleClear = () => {
    if (window.confirm('Reset all fields in setup? Unsaved notes will be cleared.')) {
      setFormData({
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
      });
    }
  };

  const loadSampleNotes = () => {
    setFormData({
      productType: 'Award',
      awardName: 'Air Force Form 1206 Quarterly Award (NCO of the Quarter)',
      formFormat: 'AF Form 1206',
      rankGrade: 'TSgt',
      afscDutyArea: '1D771 Cyber Defense Operations',
      targetBoardLevel: 'Wing',
      limitValue: '13 Lines',
      name: 'TSgt Taylor Brooks',
      dutyTitle: 'NCOIC, Cyber Defense Operations',
      unit: '688th Cyberspace Wing / 38th Cyberspace Squadron',
      inclusiveDates: '1 Oct 2024 – 31 Dec 2024',
      priorPackages: '',
      localGuidance: 'Command priority: Agile Combat Employment (ACE) cyber survivability. Use BLUF action; result--impact format.',
      rawNotes: `- Led team of 8 cyber specialists to patch 450 network endpoints during critical zero-day threat, avoided command downtime.
- Rebuilt squadron deployment comms flyaway kit; reduced prep time from 4 days to 6 hours for 3 exercises.
- Automated vulnerability scanning scripts in Python, saving 25 man-hours per week and eliminating backlog.
- Mentored 4 Airmen on Security+ certs, 100% pass rate; organized Wing STEM volunteer day with 60 local students.`,
      revisionInstructions: '',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 bg-white p-4 rounded border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-mono font-bold uppercase tracking-wider">
              AF / WMA / Joint
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Engine v32.0</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1 uppercase">
            Package Setup & Parameters
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure package metadata and raw accomplishments. The fixed writing engine transforms raw notes into board-ready bullets.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {savedDraftsCount > 0 && (
            <button
              type="button"
              onClick={onOpenDrafts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold uppercase text-slate-700 cursor-pointer transition-colors"
            >
              <FolderClock className="w-3.5 h-3.5 text-blue-600" />
              Drafts ({savedDraftsCount})
            </button>
          )}
          <button
            type="button"
            onClick={loadSampleNotes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-bold uppercase text-blue-700 cursor-pointer transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Load Sample
          </button>
        </div>
      </div>

      {/* Sensitive Data Alert if detected */}
      {sensitiveCheck.hasSensitiveData && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 flex items-start gap-2.5 shadow-sm text-xs">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-red-900 uppercase tracking-wider">Sanitization Required</h4>
            <p>
              Your notes contain prohibited or sensitive data ({sensitiveCheck.description}). Please sanitize your text to remove any classified markings, SSN, DoD ID, PHI, or personal financial information before generating.
            </p>
          </div>
        </div>
      )}

      {/* Hard Gate Notification */}
      {isHardGated ? (
        <div className="p-3 rounded bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 text-xs shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900 uppercase tracking-wider block">
              Hard Gate Active: Draft final bullets locked
            </span>
            <p className="text-xs text-amber-800 mt-0.5">
              To draft final board bullets, you must complete all required fields. Missing:{' '}
              <strong className="text-amber-950 font-bold">{missingFields.join(', ')}</strong>.
              If you proceed now, the engine will only organize notes and list gaps.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-medium shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All required criteria verified. Ready for full package drafting.</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate();
        }}
        className="space-y-6"
      >
        {/* SECTION 1: REQUIRED SETUP */}
        <div className="bg-white border border-slate-200 rounded p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              1. Required Drafting Parameters
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Hard Gate Criteria</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Product Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Product Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Award', 'Decoration'] as ProductType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, productType: type })}
                    className={`px-3 py-1.5 rounded border text-xs font-bold uppercase flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formData.productType === type
                        ? 'bg-blue-700 border-blue-700 text-white shadow-sm'
                        : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {type === 'Award' ? <Award className="w-3.5 h-3.5" /> : <Medal className="w-3.5 h-3.5" />}
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Form / Format */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Form / Format <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.formFormat}
                  onChange={(e) => setFormData({ ...formData, formFormat: e.target.value as FormFormat })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none font-medium"
                >
                  <option value="AF Form 1206">AF Form 1206</option>
                  <option value="citation">Citation (Narrative/Medal)</option>
                  <option value="WMA Form 15">WMA Form 15</option>
                  <option value="Joint">Joint Format</option>
                  <option value="Other">Other / Custom Format</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Award / Decoration Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Award / Decoration Name or Program <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.awardName}
                onChange={(e) => setFormData({ ...formData, awardName: e.target.value })}
                placeholder="e.g. AF Form 1206 Quarterly Award, Meritorious Service Medal, OAY"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
              <div className="flex flex-wrap gap-1 pt-0.5">
                {COMMON_AWARDS.slice(0, 5).map((award) => (
                  <button
                    key={award}
                    type="button"
                    onClick={() => setFormData({ ...formData, awardName: award })}
                    className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer transition-colors"
                  >
                    {award}
                  </button>
                ))}
              </div>
            </div>

            {/* Rank / Grade */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Rank / Grade <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.rankGrade}
                  onChange={(e) => setFormData({ ...formData, rankGrade: e.target.value })}
                  placeholder="e.g. TSgt, SrA, Capt, GS-12"
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_RANKS.slice(3, 10).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData({ ...formData, rankGrade: r })}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                      formData.rankGrade === r
                        ? 'bg-blue-700 text-white border-blue-700 font-bold'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* AFSC or Duty Area */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                AFSC or Duty Area <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.afscDutyArea}
                onChange={(e) => setFormData({ ...formData, afscDutyArea: e.target.value })}
                placeholder="e.g. 1D7X1 Cyber, 14N Intel, 2A6X1, 3F0X1"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />
            </div>

            {/* Target Board / Approval Level */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Target Board / Approval Level <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.targetBoardLevel}
                  onChange={(e) => setFormData({ ...formData, targetBoardLevel: e.target.value as BoardLevel })}
                  className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none font-medium"
                >
                  <option value="Squadron">Squadron Level</option>
                  <option value="Wing">Wing Level</option>
                  <option value="MAJCOM">MAJCOM / NAF</option>
                  <option value="Joint">Joint Task Force / UCC</option>
                  <option value="DAF">Department of the Air Force (DAF)</option>
                  <option value="Other">Other / Special Board</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Line or Character Limit */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Line or Character Limit <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowLimitHelp(!showLimitHelp)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3 h-3" />
                  Rules
                </button>
              </div>

              <input
                type="text"
                value={formData.limitValue}
                onChange={(e) => setFormData({ ...formData, limitValue: e.target.value })}
                placeholder="e.g. 13 Lines, 1500 Characters, 24 Lines"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
              />

              <div className="flex flex-wrap gap-1 mt-1.5">
                {LIMIT_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, limitValue: p.value })}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                      formData.limitValue === p.value
                        ? 'bg-blue-700 text-white border-blue-700 font-bold'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {showLimitHelp && (
                <div className="mt-1.5 p-2 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-700 space-y-0.5">
                  <p><strong>Strict Requirement:</strong> The writing engine treats limits as non-negotiable.</p>
                  <p>Standard: 13 lines for quarterly 1206, 1,500 characters for citations, 24 lines for annual awards.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: OPTIONAL CONTEXT & HYGIENE */}
        <div className="bg-white border border-slate-200 rounded p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              2. Optional Nominee Info & Context Hygiene
            </h2>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Progression & Packaging</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Nominee Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. TSgt Alex Mercer"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Duty Title</label>
              <input
                type="text"
                value={formData.dutyTitle}
                onChange={(e) => setFormData({ ...formData, dutyTitle: e.target.value })}
                placeholder="e.g. Flight Chief, Cyber"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Unit / Org</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g. 505th CCW"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Inclusive Dates</label>
              <input
                type="text"
                value={formData.inclusiveDates}
                onChange={(e) => setFormData({ ...formData, inclusiveDates: e.target.value })}
                placeholder="e.g. 1 Jan 2024 – 31 Dec 2024"
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Prior awards packages or EPBs */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Prior Awards Packages or EPBs
              </label>
              <span className="text-[10px] text-slate-400">Progression comparison</span>
            </div>
            <textarea
              rows={3}
              value={formData.priorPackages}
              onChange={(e) => setFormData({ ...formData, priorPackages: e.target.value })}
              placeholder="Paste prior quarterly 1206 bullets, last year's EPB achievements, or past decorations to verify scope growth..."
              className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {!formData.priorPackages.trim() && (
              <p className="text-[11px] text-amber-700 font-mono">
                Notice: Progression assessment is degraded without prior packages.
              </p>
            )}
          </div>

          {/* Local / Command Guidance */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Local / Command Guidance
            </label>
            <textarea
              rows={2}
              value={formData.localGuidance}
              onChange={(e) => setFormData({ ...formData, localGuidance: e.target.value })}
              placeholder="e.g. Wing emphasis on ACE, prioritize joint deployments, avoid standard acronyms in headers..."
              className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* SECTION 3: RAW NOTES & ACCOMPLISHMENTS */}
        <div className="bg-white border border-slate-200 rounded p-4 sm:p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                3. Raw Notes / Accomplishments
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Paste rough bullet fragments, dates, metrics, actions, leadership roles, or mission impacts.
              </p>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {formData.rawNotes.length} chars
            </span>
          </div>

          <textarea
            rows={7}
            value={formData.rawNotes}
            onChange={(e) => setFormData({ ...formData, rawNotes: e.target.value })}
            placeholder={`Enter raw notes here (unsanitized PII/classified will be rejected):\n\n- Spearheaded software migration across 45 systems, saved $120K in contractor fees\n- Resolved 140 critical outages during exercise Northern Strike\n- Volunteered 30 hrs as booster club treasurer; raised $4.2K for annual awards banquet`}
            className="w-full bg-slate-50 border border-slate-300 rounded p-3 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono leading-relaxed"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="w-full sm:w-auto px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 border border-slate-300 text-xs font-bold uppercase text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            Clear All
          </button>

          <button
            type="submit"
            disabled={isGenerating || sensitiveCheck.hasSensitiveData}
            className={`w-full sm:w-auto px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all ${
              isHardGated
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                : 'bg-blue-700 hover:bg-blue-800 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGenerating ? (
              'Architecting Package...'
            ) : isHardGated ? (
              'Generate (Organize Notes & Identify Gaps)'
            ) : (
              'Generate Draft Package'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

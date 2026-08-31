import React from 'react';
import {
  X,
  Target,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { MurderboardResult } from '../types';

interface MurderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: MurderboardResult | null;
  isLoading: boolean;
  awardName: string;
}

export const MurderboardModal: React.FC<MurderboardModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  awardName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-800 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-red-600 text-white">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-red-700 text-white px-2 py-0.5 rounded">
                  Murderboard Simulation
                </span>
                <span className="text-[11px] text-slate-300">Mock Board President Review</span>
              </div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight mt-0.5">
                {awardName || 'Draft Package Evaluation'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
              <p className="text-sm font-bold text-slate-900 uppercase">
                Board President is dissecting bullets & checking metrics...
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Auditing causal claims, testing scope resilience, and identifying vulnerabilities under strict board criteria.
              </p>
            </div>
          ) : result ? (
            <>
              {/* Overall Score Banner */}
              <div className="p-4 rounded bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-4 justify-between">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                    Board Readiness Rating
                  </span>
                  <p className="text-slate-800 text-xs leading-relaxed max-w-lg">
                    {result.overallAssessment}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center p-3 rounded bg-white border border-slate-200 shrink-0 min-w-[110px] shadow-sm">
                  <span className={`text-3xl font-extrabold font-mono ${
                    result.overallScore >= 8
                      ? 'text-emerald-700'
                      : result.overallScore >= 6
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}>
                    {result.overallScore}
                    <span className="text-sm text-slate-400">/10</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 mt-0.5">
                    {result.overallScore >= 8 ? 'Competitive' : result.overallScore >= 6 ? 'Needs Polish' : 'At Risk'}
                  </span>
                </div>
              </div>

              {/* Scoring Rubric */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  Scoring Rubric Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {result.scoringRubric?.map((rubric, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded bg-slate-50 border border-slate-200 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs uppercase tracking-tight">
                          {rubric.category}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          rubric.score >= 8
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : rubric.score >= 6
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {rubric.score}/10
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {rubric.critique}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Board Challenge Questions */}
              {result.boardQuestions && result.boardQuestions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                    Board Defense & Challenge Points
                  </h3>
                  <div className="space-y-2">
                    {result.boardQuestions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded bg-amber-50/50 border border-amber-200 space-y-1.5 text-xs"
                      >
                        <div className="p-2 rounded bg-white border border-amber-200 text-slate-800 font-mono text-[11px] italic">
                          "{q.targetBullet}"
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                          <div>
                            <span className="font-bold text-amber-900 block mb-0.5 text-[10px] uppercase">
                              Board Question:
                            </span>
                            <p className="text-slate-700 text-[11px]">{q.challengeQuestion}</p>
                          </div>
                          <div>
                            <span className="font-bold text-red-800 block mb-0.5 text-[10px] uppercase">
                              Package Vulnerability:
                            </span>
                            <p className="text-slate-700 text-[11px]">{q.vulnerability}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Tactical Improvements for Win
                  </h3>
                  <ul className="space-y-1 list-disc pl-5 text-xs text-slate-700">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="leading-relaxed text-[11px]">
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center text-slate-500">
              No review data available. Click Murderboard to evaluate package.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
          >
            Return to Workspace
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Info } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-[#C00000] text-white py-1.5 px-4 text-xs font-bold tracking-wider shadow-sm z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left flex-1 justify-center sm:justify-start">
          <ShieldAlert className="w-4 h-4 text-white shrink-0" />
          <p className="uppercase text-[11px] sm:text-xs font-bold tracking-wide">
            Do not enter classified information, CUI, SSN, DOD ID, PHI, or personal financial data. Sanitize notes first.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-white/90 hover:text-white bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Info className="w-3 h-3" />
            {showDetails ? 'Close Policy' : 'Policy & Storage'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="bg-[#990000] border-t border-white/20 mt-1.5 p-3 text-white/95 text-xs animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto space-y-1.5">
            <div className="flex items-center gap-2 text-amber-200 font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Storage Client & Device Sandboxing Guarantees:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-white/90 text-[11px] font-normal">
              <li><strong>No Login Required:</strong> No user accounts, credentials, or remote tracking.</li>
              <li><strong>Local Storage Only:</strong> All drafts and working notes are saved exclusively in your local browser storage on this device.</li>
              <li><strong>Transient Processing:</strong> Data is only sent to the writing engine during explicit Generate/Improve requests.</li>
              <li><strong>Automated Guardrails:</strong> Submissions with detectable SSN, DoD ID, CUI markings, PHI, or financial data are automatically blocked from rewriting.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

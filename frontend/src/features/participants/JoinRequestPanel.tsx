'use client';

import { JoinRequest } from '@/types';
import Button from '@/components/ui/Button';

interface JoinRequestPanelProps {
  requests: JoinRequest[];
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export default function JoinRequestPanel({ requests, onApprove, onReject }: JoinRequestPanelProps) {
  if (requests.length === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
      <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Join Requests ({requests.length})
      </h4>
      <div className="space-y-2">
        {requests.map((req) => (
          <div key={req.requestId} className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white flex-none">
              {req.name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 text-sm text-white/90 truncate">{req.name}</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => onApprove(req.requestId)}
                className="text-xs font-semibold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(req.requestId)}
                className="text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

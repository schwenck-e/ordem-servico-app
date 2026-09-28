import React from 'react';
import {
  History,
  PlusCircle,
  PlayCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '@/components/common/Badge';
import { formatDateTime } from '@/lib/formatters';
import type { WorkOrderLog, WorkOrderStatus } from '@/types';

interface WorkOrderTimelineProps {
  logs: WorkOrderLog[];
}

const statusNodeConfig: Record<
  WorkOrderStatus,
  {
    icon: React.FC<{ className?: string }>;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  OPEN: {
    icon: PlusCircle,
    bgColor: 'bg-sky-50',
    textColor: 'text-sky-600',
    borderColor: 'border-sky-300',
  },
  IN_PROGRESS: {
    icon: PlayCircle,
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-300',
  },
  WAITING_PARTS: {
    icon: Clock,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-300',
  },
  WAITING_APPROVAL: {
    icon: AlertCircle,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-300',
  },
  COMPLETED: {
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-300',
  },
  CANCELED: {
    icon: XCircle,
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-300',
  },
};

export const WorkOrderTimeline: React.FC<WorkOrderTimelineProps> = ({ logs }) => {
  // Sort logs chronologically (newest first for timeline reading or oldest first with progress line)
  // Usually in work order auditing, newest at top or chronological ascending.
  // Standard in activity timelines: ascending (order opened -> in progress -> completed) or descending.
  // Let's sort chronologically ascending so the progress flows naturally downwards,
  // or descending with latest event first. Let's inspect logs:
  // Sorting newest first is very common for event logs, but let's provide clear flow.
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <History className="w-4 h-4 text-primary-600" />
          <span>Histórico & Linha do Tempo</span>
        </h2>
        <span className="text-xs text-slate-500 font-medium">
          {sortedLogs.length} {sortedLogs.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {sortedLogs.length > 0 ? (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {sortedLogs.map((log) => {
            const config = statusNodeConfig[log.newStatus] || {
              icon: History,
              bgColor: 'bg-slate-50',
              textColor: 'text-slate-600',
              borderColor: 'border-slate-300',
            };
            const Icon = config.icon;

            return (
              <div key={log.id} className="relative group">
                {/* Node circular icon */}
                <div
                  className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 ${config.borderColor} ${config.bgColor} ${config.textColor} flex items-center justify-center ring-4 ring-white shadow-xs`}
                >
                  <Icon className="w-3 h-3" />
                </div>

                {/* Event Content */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3 space-y-2 hover:bg-slate-50 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{log.createdBy || 'Sistema'}</span>
                    </div>
                    <time className="text-slate-400 font-mono text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </time>
                  </div>

                  {/* Transition display */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {log.previousStatus && (
                      <>
                        <StatusBadge status={log.previousStatus} />
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </>
                    )}
                    <StatusBadge status={log.newStatus} />
                  </div>

                  {/* Comment / Note */}
                  {log.comment && (
                    <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200/70 whitespace-pre-wrap leading-relaxed">
                      {log.comment}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center text-slate-400 text-xs">
          Nenhum evento registrado no histórico desta ordem.
        </div>
      )}
    </div>
  );
};

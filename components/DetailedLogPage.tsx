import React, { useState, useMemo } from 'react';
import { Session } from '../types';
import { getDhakaDate, formatDuration } from '../utils/time';
import Icon from './Icon';

interface DetailedLogPageProps {
  sessions: Session[];
}

const convertToCSV = (sessions: Session[]): string => {
    if (sessions.length === 0) return '';

    const headers = [
        "Date (Dhaka)", "URL", "Duration (HH:MM:SS)",
        "Mobile Score Before", "Mobile Score After", "Desktop Score Before", "Desktop Score After"
    ];

    const rows = sessions.map(s => {
        const row = [
            getDhakaDate(new Date(s.startTime)),
            `"${s.url}"`,
            formatDuration(s.duration),
            Math.round(s.beforeScores.mobile * 100),
            Math.round(s.afterScores.mobile * 100),
            Math.round(s.beforeScores.desktop * 100),
            Math.round(s.afterScores.desktop * 100)
        ];
        return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
};

const DetailedLogPage: React.FC<DetailedLogPageProps> = ({ sessions }) => {
  const [filter, setFilter] = useState<'day' | 'week' | 'month' | 'year'>('day');

  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      if (filter === 'day') {
        return sessionDate.toDateString() === now.toDateString();
      }
      if (filter === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= oneWeekAgo;
      }
      if (filter === 'month') {
        return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
      }
      if (filter === 'year') {
        return sessionDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sessions, filter]);

  const handleDownload = () => {
    const csv = convertToCSV(filteredSessions);
    if (!csv) return;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `FastLoad-Pro_Session-History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-brand-text-primary mb-4">Detailed Session Logs</h1>

      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button onClick={() => setFilter('day')} className={`px-4 py-2 rounded ${filter === 'day' ? 'bg-brand-accent-start text-white' : 'bg-brand-surface'}`}>Day</button>
          <button onClick={() => setFilter('week')} className={`px-4 py-2 rounded ${filter === 'week' ? 'bg-brand-accent-start text-white' : 'bg-brand-surface'}`}>Week</button>
          <button onClick={() => setFilter('month')} className={`px-4 py-2 rounded ${filter === 'month' ? 'bg-brand-accent-start text-white' : 'bg-brand-surface'}`}>Month</button>
          <button onClick={() => setFilter('year')} className={`px-4 py-2 rounded ${filter === 'year' ? 'bg-brand-accent-start text-white' : 'bg-brand-surface'}`}>Year</button>
        </div>
        <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 bg-brand-surface border border-brand-border hover:bg-brand-border rounded-md transition-colors">
          <Icon name="sheet" className="w-4 h-4" /> Download CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-b border-brand-border text-xs text-brand-text-secondary uppercase">
              <th className="py-2 pr-2 font-semibold">Date (Dhaka)</th>
              <th className="py-2 px-2 font-semibold">URL</th>
              <th className="py-2 px-2 font-semibold">Duration</th>
              <th className="py-2 pl-2 font-semibold">Mobile Perf.</th>
              <th className="py-2 pl-2 font-semibold">Desktop Perf.</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map(session => (
              <tr key={session.id || session.startTime} className="border-b border-brand-border hover:bg-brand-background">
                <td className="py-3 pr-2">{getDhakaDate(new Date(session.startTime))}</td>
                <td className="py-3 px-2 truncate max-w-xs text-brand-accent-start" title={session.url}>{session.url}</td>
                <td className="py-3 px-2 font-mono">{formatDuration(session.duration)}</td>
                <td className="py-3 pl-2">{session.beforeScores.mobile.toFixed(2)} -> {session.afterScores.mobile.toFixed(2)}</td>
                <td className="py-3 pl-2">{session.beforeScores.desktop.toFixed(2)} -> {session.afterScores.desktop.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DetailedLogPage;

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { getDhakaDate, formatDuration } from '../utils/time';
import { Session } from '../types';

interface SessionLogProps {
    sessions: Session[];
    setSessions: (sessions: Session[]) => void;
    userId: string | null;
}

interface ScoreDiffProps {
    before: number;
    after: number;
}

const ScoreDiff = ({ before, after }: ScoreDiffProps) => {
    if (before === undefined || after === undefined) return null;
    const diff = Math.round(after * 100) - Math.round(before * 100);
    const color = diff > 0 ? 'text-brand-success' : diff < 0 ? 'text-brand-danger' : 'text-brand-text-secondary';
    const sign = diff > 0 ? '+' : '';
    return (
        <span>
            {Math.round(before * 100)} &rarr; {Math.round(after * 100)} <span className={`font-bold ${color}`}>({sign}{diff})</span>
        </span>
    );
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

const SessionLog = ({ sessions, setSessions, userId }: SessionLogProps) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(true);
    const [isClearing, setIsClearing] = useState(false);

    const displayedSessions = useMemo(() => {
        return sessions.slice(0, 3);
    }, [sessions]);

    const handleDownload = () => {
        const csv = convertToCSV(sessions);
        if (!csv) return;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `FastLoad-Pro_Session-History_${userId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleClear = async () => {
        if (!userId || !window.confirm('Are you sure you want to delete your entire session history? This action cannot be undone.')) return;
        setIsClearing(true);
        try {
            const response = await fetch(`/api/sessions?userId=${userId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to clear history' }));
                throw new Error(errorData.message);
            }
            setSessions([]);
        } catch (error: any) {
            console.error('Error clearing history:', error);
            alert(`Could not clear history: ${error.message}`);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="bg-brand-surface rounded-xl border border-brand-border">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-lg font-semibold text-left text-brand-accent-end"
                aria-expanded={isOpen}
            >
                <span className="flex items-center gap-2"><Icon name="history" className="w-5 h-5" />Session History</span>
                <Icon name="chevronDown" className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] p-4' : 'max-h-0'}`}
            >
                <div className="border-t border-brand-border pt-4 text-brand-text-secondary text-sm space-y-4">
                   {sessions.length === 0 ? (
                       <p>No completed sessions yet. Complete a full "Measure" and "Compare" cycle to log a session.</p>
                   ) : (
                       <>
                        <div className="p-4 bg-brand-background rounded-lg flex flex-wrap justify-between items-center gap-4">
                            <div>
                                <h4 className="font-semibold text-brand-text-primary">Your Session Log</h4>
                                <p className="text-xs text-brand-text-secondary mt-1">
                                    {`Showing the latest ${displayedSessions.length} of ${sessions.length} total sessions.`}
                                </p>
                            </div>
                           <div className="flex gap-2 flex-wrap">
                             {sessions.length > 3 && (
                                <button
                                    onClick={() => navigate('/logs')}
                                    className="text-sm font-semibold py-2 px-4 bg-brand-surface border border-brand-border hover:bg-brand-border rounded-md transition-colors"
                                >
                                    View Detailed Log
                                </button>
                             )}
                              <button onClick={handleDownload} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 bg-brand-surface border border-brand-border hover:bg-brand-border rounded-md transition-colors">
                                <Icon name="sheet" className="w-4 h-4" /> Download CSV
                              </button>
                              <button onClick={handleClear} disabled={isClearing} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 bg-brand-danger/20 border border-brand-danger/50 text-brand-danger hover:bg-brand-danger/40 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                {isClearing ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div> : <Icon name="trash" className="w-4 h-4" />} Clear History
                              </button>
                              <button onClick={() => navigate('/logs')} className="flex items-center gap-2 text-sm font-semibold py-2 px-4 bg-brand-surface border border-brand-border hover:bg-brand-border rounded-md transition-colors">
                                <Icon name="sheet" className="w-4 h-4" /> View Detailed Log
                              </button>
                           </div>
                       </div>
                        {displayedSessions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] text-left">
                                    <thead>
                                        <tr className="border-b border-brand-border text-xs text-brand-text-secondary uppercase">
                                            <th className="py-2 pr-2 font-semibold">Date</th>
                                            <th className="py-2 px-2 font-semibold">URL</th>
                                            <th className="py-2 px-2 font-semibold">Duration</th>
                                            <th className="py-2 pl-2 font-semibold">Performance</th>
                                            <th className="py-2 pl-2 font-semibold">Accessibility</th>
                                            <th className="py-2 pl-2 font-semibold">Best Practices</th>
                                            <th className="py-2 pl-2 font-semibold">SEO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedSessions.map(session => (
                                            <tr key={session.id || session.startTime} className="border-b border-brand-border hover:bg-brand-background">
                                                <td className="py-3 pr-2">{getDhakaDate(new Date(session.startTime))}</td>
                                                <td className="py-3 px-2 truncate max-w-xs text-brand-accent-start" title={session.url}>{session.url}</td>
                                                <td className="py-3 px-2 font-mono">{formatDuration(session.duration)}</td>
                                                <td className="py-3 pl-2"><ScoreDiff before={session.beforeScores.mobile} after={session.afterScores.mobile} /></td>
                                                <td className="py-3 pl-2"><ScoreDiff before={session.beforeScores.accessibility} after={session.afterScores.accessibility} /></td>
                                                <td className="py-3 pl-2"><ScoreDiff before={session.beforeScores.bestPractices} after={session.afterScores.bestPractices} /></td>
                                                <td className="py-3 pl-2"><ScoreDiff before={session.beforeScores.seo} after={session.afterScores.seo} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                           ) : (
                                <p className="text-center py-4">No sessions found for the selected period.</p>
                           )}
                       </>
                   )}
                </div>
            </div>
        </div>
    );
};

export default SessionLog;
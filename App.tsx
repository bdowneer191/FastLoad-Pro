import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './services/firebase.ts';
import Icon from './components/Icon.tsx';
import SetupGuide from './components/SetupGuide.tsx';
import SessionLog from './components/SessionLog.tsx';
import SessionTimer from './components/SessionTimer.tsx';
import Auth from './components/Auth.tsx';
import VerifyEmail from './components/VerifyEmail.tsx';
import UserProfile from './components/UserProfile.tsx';
import { useCleaner } from './hooks/useCleaner.ts';
import { useUserData } from './hooks/useUserData.ts';
import { generateOptimizationPlan, generateComparisonAnalysis } from './services/geminiService.ts';
import { fetchPageSpeedReport } from './services/pageSpeedService.ts';
import { Recommendation, Session, ImpactSummary } from './types.ts';

const initialOptions = {
  stripComments: true,
  collapseWhitespace: true,
  minifyInlineCSSJS: true,
  removeEmptyAttributes: true,
  preserveIframes: true,
  preserveLinks: true,
  preserveShortcodes: true,
  lazyLoadEmbeds: true,
  lazyLoadImages: true,
  optimizeImages: true,
  convertToAvif: false, 
  addResponsiveSrcset: true,
  optimizeSvgs: true,
  semanticRewrite: false,
  optimizeCssLoading: false, 
  optimizeFontLoading: true,
  addPrefetchHints: true,
  deferScripts: true,
  lazyLoadBackgroundImages: true,
  progressiveImageLoading: true,
  optimizeVideoElements: true,
};

const Step = ({ number, title, children }) => (
    <div className="p-6 bg-brand-surface rounded-xl border border-brand-border relative overflow-hidden transition-all duration-300 hover:border-brand-accent-start hover:shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent-start/30 to-transparent"></div>
        <h2 className="text-xl font-semibold mb-4 text-brand-accent-start flex items-center">
            <span className="bg-gradient-to-br from-brand-accent-start to-brand-accent-end text-white rounded-full h-8 w-8 inline-flex items-center justify-center font-bold mr-3 flex-shrink-0">{number}</span>
            {title}
        </h2>
        <div className="pl-11">{children}</div>
    </div>
);


const ScoreCircle = ({ score, size = 60 }) => {
    const scoreValue = score ? Math.round(score * 100) : 0;
    const getScoreColor = (s) => {
        if (s >= 90) return { main: 'text-brand-success', trail: 'text-brand-success/20' };
        if (s >= 50) return { main: 'text-brand-warning', trail: 'text-brand-warning/20' };
        return { main: 'text-brand-danger', trail: 'text-brand-danger/20' };
    };
    const { main, trail } = getScoreColor(scoreValue);
    const radius = size / 2 - 4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (scoreValue / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="absolute" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle className={`transform -rotate-90 origin-center ${trail}`} strokeWidth="4" stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2} />
                <circle
                    className={`transform -rotate-90 origin-center transition-all duration-1000 ease-out ${main}`}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size/2}
                    cy={size/2}
                />
            </svg>
            <span className={`text-lg font-bold ${main}`}>{scoreValue}</span>
        </div>
    );
};

const PageSpeedScores = ({ report, comparisonReport = null }) => {
    if (!report) return null;
    
    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    const getCategoryName = (id) => id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const renderScores = (data, compareData = null) => {
      return categories.map(catId => {
        const category = data?.lighthouseResult.categories[catId];
        if (!category) return null;
        const compareCategory = compareData?.lighthouseResult.categories[catId];
        const scoreDiff = compareCategory ? Math.round(compareCategory.score * 100) - Math.round(category.score * 100) : null;
        
        return (
          <div key={catId} className="text-center p-2 bg-brand-background rounded-lg flex flex-col items-center justify-start h-full">
            <p className="text-xs font-semibold text-brand-text-secondary mb-2 h-8 flex items-center text-center justify-center">{getCategoryName(category.title)}</p>
            <div className="flex-grow flex items-center justify-center w-full">
                <div className="flex items-center justify-around w-full">
                    <div className="flex flex-col items-center">
                         <span className="text-xs text-brand-text-secondary/80 mb-1">{compareCategory ? 'Before' : 'Score'}</span>
                        <ScoreCircle score={category.score} size={50} />
                    </div>
                    {compareCategory && (
                        <>
                            <span className="text-brand-text-secondary text-xl font-light">&rarr;</span>
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-brand-text-secondary/80 mb-1">After</span>
                                <ScoreCircle score={compareCategory.score} size={50} />
                            </div>
                        </>
                    )}
                </div>
            </div>
            {compareCategory && scoreDiff !== null && (
              <div className="mt-2 text-center">
                  <span className={`text-base font-bold ${scoreDiff > 0 ? 'text-brand-success' : scoreDiff < 0 ? 'text-brand-danger' : 'text-brand-text-secondary'}`}>
                      {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                  </span>
                  <span className="text-xs text-brand-text-secondary"> points</span>
              </div>
            )}
            {!compareCategory && <div className="h-6 mt-2" />}
          </div>
        );
      });
    };

    return (
        <div className="mt-4 space-y-4">
            <div>
                <h3 className="font-semibold text-brand-text-primary mb-2">Mobile Scores {comparisonReport && <span className="text-sm font-normal text-brand-text-secondary">(Before vs. After)</span>}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {renderScores(report.mobile, comparisonReport?.mobile)}
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-brand-text-primary mb-2">Desktop Scores {comparisonReport && <span className="text-sm font-normal text-brand-text-secondary">(Before vs. After)</span>}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {renderScores(report.desktop, comparisonReport?.desktop)}
                </div>
            </div>
        </div>
    );
};

const CheckboxOption = ({ name, checked, onChange, label, description, isRecommended = false, isRisky = false, disabled = false }) => (
    <label className={`flex items-start space-x-3 p-3 rounded-lg hover:bg-brand-background transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <input 
            type="checkbox" 
            name={name} 
            checked={checked} 
            onChange={onChange} 
            disabled={disabled}
            className="form-checkbox h-4 w-4 rounded bg-brand-surface border-brand-border text-brand-accent-start focus:ring-brand-accent-start mt-1 transition"
        />
        <div>
            <span className="text-brand-text-primary text-sm font-medium">
                {label}
                {isRecommended && <span className="ml-2 text-xs text-brand-success font-medium">(Recommended)</span>}
                {isRisky && <span className="ml-2 text-xs text-brand-warning font-medium">(Use with caution)</span>}
            </span>
            {description && <p className="text-xs text-brand-text-secondary mt-0.5">{description}</p>}
        </div>
    </label>
);


const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [url, setUrl] = useState('');
  
  
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [pageSpeedBefore, setPageSpeedBefore] = useState(null);
  const [pageSpeedAfter, setPageSpeedAfter] = useState(null);
  const [optimizationPlan, setOptimizationPlan] = useState<Recommendation[] | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [comparisonAnalysis, setComparisonAnalysis] = useState(null);
  const [apiError, setApiError] = useState('');
  const [sessionLoadError, setSessionLoadError] = useState('');

  const [originalHtml, setOriginalHtml] = useState('');
  const [cleanedHtml, setCleanedHtml] = useState('');
  const [options, setOptions] = useState(initialOptions);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const { isCleaning, cleanHtml } = useCleaner();
  const [aiAppliedNotification, setAiAppliedNotification] = useState('');
  
  const [currentSession, setCurrentSession] = useState<{ url: string; startTime: string; } | null>(null);
  const [sessionLog, setSessionLog] = useState<Session[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
        setSessionLoadError('');
        try {
            // Fetch Session History
            const sessionsResponse = await fetch(`/api/sessions?userId=${user.uid}`);
            if (!sessionsResponse.ok) {
                const errorData = await sessionsResponse.json().catch(() => ({ message: 'Failed to fetch session data.' }));
                throw new Error(errorData.message);
            }
            const sessionsData = await sessionsResponse.json();
            setSessionLog(sessionsData);
        } catch (error: any) {
            console.error("Failed to load user data:", error);
            setSessionLoadError(`Could not load history or keys: ${error.message}`);
        }
    };

    fetchUserData();
  }, [user]);


  const { userData } = useUserData(user);

  const handleMeasure = async () => {
    if (!url) { setApiError('Please enter a URL to measure.'); return; }
    if (!userData.pageSpeedApiKey) { setApiError('Please provide and save your PageSpeed API Key to measure speed.'); return; }
    
    setIsMeasuring(true);
    setApiError('');
    setSessionLoadError('');

    if (!pageSpeedBefore) {
        setOptimizationPlan(null);
        setComparisonAnalysis(null);
        setPageSpeedAfter(null);
        setCurrentSession({ url, startTime: new Date().toISOString() });
        setOriginalHtml('');
        setCleanedHtml('');
        setImpact(null);
        setOptions(initialOptions);
    }
    
    try {
        const newReport = await fetchPageSpeedReport(userData.pageSpeedApiKey, url);

        if (pageSpeedBefore) {
            setPageSpeedAfter(newReport);
            if(currentSession && user) {
                const endTime = new Date();
                const duration = (endTime.getTime() - new Date(currentSession.startTime).getTime()) / 1000;
                
                const getScore = (report, strategy) => report?.[strategy]?.lighthouseResult?.categories?.performance?.score ?? 0;

                const completedSession: Omit<Session, 'id' | 'userId'> & { userId: string } = {
                    url: currentSession.url,
                    startTime: currentSession.startTime,
                    endTime: endTime.toISOString(),
                    duration,
                    beforeScores: {
                        mobile: getScore(pageSpeedBefore, 'mobile'),
                        desktop: getScore(pageSpeedBefore, 'desktop'),
                    },
                    afterScores: {
                        mobile: getScore(newReport, 'mobile'),
                        desktop: getScore(newReport, 'desktop'),
                    },
                    userId: user.uid,
                };
                
                const response = await fetch(`/api/sessions?userId=${user.uid}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(completedSession)
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: 'The server returned an unexpected error. Check Vercel function logs for details.' }));
                    throw new Error(errorData.message ? `Could not save session: ${errorData.message}` : 'Could not save session due to a server error.');
                }

                const savedSession = await response.json();
                setSessionLog(prevLog => [savedSession, ...prevLog].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
                
                setCurrentSession(null);
                
                setIsGeneratingPlan(true);
                const analysis = await generateComparisonAnalysis(userData.geminiApiKey, pageSpeedBefore, newReport);
                setComparisonAnalysis(analysis);
            }

        } else {
            setPageSpeedBefore(newReport);
            setIsGeneratingPlan(true);
            const plan = await generateOptimizationPlan(userData.geminiApiKey, newReport);
            setOptimizationPlan(plan);
        }
    } catch (error: any) {
        console.error("Error during measurement process:", error);
        let message = error.message;
        if (message && message.includes('API has not been used')) {
            message = 'API Error: The PageSpeed Insights API has not been enabled for your key\'s project. Please follow the setup guide to fix this.';
        }
        setApiError(message);
        setCurrentSession(null);
    } finally {
        setIsMeasuring(false);
        setIsGeneratingPlan(false);
    }
  };

  const handleOptionChange = (e) => {
    const { name, checked } = e.target;
    setOptions(prev => ({ ...prev, [name]: checked }));
  };

  const handleClean = useCallback(async () => {
    if (!originalHtml || isCleaning) return;
    
    setApiError('');
    setCleanedHtml('');
    setImpact(null);

    const { cleanedHtml: resultHtml, summary, effectiveOptions } = await cleanHtml(originalHtml, options, optimizationPlan);
    
    setCleanedHtml(resultHtml);
    setImpact(summary);
    setOptions(effectiveOptions);

    if (summary.actionLog.some(log => log.includes('AI recommendation'))) {
        setAiAppliedNotification('AI recommendations have been automatically applied!');
        setTimeout(() => setAiAppliedNotification(''), 4000);
    }
  }, [originalHtml, options, cleanHtml, isCleaning, optimizationPlan]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cleanedHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const downloadHtml = () => {
      const blob = new Blob([cleanedHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cleaned-post.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };
  
  const formattedBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const impactMetrics = useMemo(() => ([
      { label: 'Bytes Saved', value: impact ? formattedBytes(impact.bytesSaved) : '-', color: 'text-brand-success' },
      { label: 'Size Reduction', value: impact?.originalBytes ? `${((impact.bytesSaved / impact.originalBytes) * 100).toFixed(1)}%` : '-', color: 'text-brand-success' },
      { label: 'Nodes Removed', value: impact?.nodesRemoved || '-', color: 'text-brand-warning' },
  ]), [impact]);

  const isCleaningLocked = !pageSpeedBefore;

  if (authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-background">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-accent-start"></div>
        </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!user.emailVerified) {
    return <VerifyEmail />;
  }

  return (
    <div className="min-h-screen text-brand-text-primary bg-brand-background p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <header className="mb-8 relative">
          <div className="absolute top-0 right-0 z-10">
              <UserProfile user={user} />
          </div>
          <div className="text-center">
             <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-start to-brand-accent-end animate-glow">FastLoad Pro</h1>
            <p className="text-lg text-brand-text-secondary mt-2">Full Performance Analysis & Speed Boost</p>
            <p className="text-brand-text-secondary mt-1">Prod by <span className="font-semibold text-brand-accent-start">Nion</span></p>
          </div>
        </header>
        
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="mb-2">
              <SetupGuide />
            </div>
            <div className="mb-2">
              <SessionLog sessions={sessionLog} setSessions={setSessionLog} userId={user.uid} />
              {sessionLoadError && <p className="mt-2 text-sm text-brand-danger p-3 bg-brand-danger/10 border border-brand-danger/30 rounded-lg">{sessionLoadError}</p>}
            </div>
            <Step number="1" title="Measure Your Page Speed">
                {currentSession && <SessionTimer startTime={currentSession.startTime} />}
                <p className="text-sm text-brand-text-secondary mb-3">Enter a URL to get a baseline performance report.</p>
                <div className="flex gap-2">
                    <input type="url" value={url} onChange={e => { setUrl(e.target.value); setPageSpeedBefore(null); }} placeholder="https://your-website.com/your-post" className="flex-grow p-3 bg-brand-background border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent-start focus:border-brand-accent-start focus:outline-none text-sm font-mono transition-colors"/>
                    <button onClick={handleMeasure} disabled={isMeasuring || !url || !userData.pageSpeedApiKey} className="flex items-center justify-center gap-2 w-48 py-3 px-4 bg-gradient-to-r from-brand-accent-start to-brand-accent-end text-white rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-0.5 disabled:from-brand-surface disabled:to-brand-surface disabled:text-brand-text-secondary disabled:cursor-not-allowed disabled:transform-none">
                      {isMeasuring ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Icon name="magic" className="w-5 h-5" />}
                      {pageSpeedBefore ? 'Compare Speed' : 'Measure Speed'}
                    </button>
                </div>
                {apiError && <p className="mt-2 text-sm text-brand-danger p-3 bg-brand-danger/10 border border-brand-danger/30 rounded-lg">{apiError}</p>}
                {isMeasuring && <p className="text-sm text-center text-brand-text-secondary mt-4 animate-subtle-pulse">Measuring page speed... this can take up to a minute.</p>}
                <PageSpeedScores report={pageSpeedBefore} comparisonReport={pageSpeedAfter} />
            </Step>

            {(optimizationPlan || comparisonAnalysis || isGeneratingPlan) && (
                <Step number="2" title={comparisonAnalysis ? "Comparison Analysis" : "AI Optimization Plan"}>
                   {isGeneratingPlan && <p className="text-sm text-center text-brand-text-secondary animate-subtle-pulse">Generating AI analysis...</p>}
                    {optimizationPlan && !comparisonAnalysis && (
                         <div className="space-y-3">
                            {optimizationPlan.map((item, i) => (
                                <div key={i} className="p-3 bg-brand-background rounded-lg border border-brand-border/50">
                                    <h3 className="font-semibold text-brand-text-primary flex items-center gap-2">{item.title} <span className={`text-xs px-2 py-0.5 rounded-full ${item.priority === 'High' ? 'bg-brand-danger text-white' : item.priority === 'Medium' ? 'bg-brand-warning text-white' : 'bg-brand-success text-white'}`}>{item.priority}</span></h3>
                                    <p className="text-sm text-brand-text-secondary">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {comparisonAnalysis && (
                        <div className="space-y-4">
                            <div>
                               <h3 className="font-semibold text-brand-text-primary mb-1">Summary</h3>
                               <p className="text-sm text-brand-text-secondary p-3 bg-brand-background rounded-lg border border-brand-border/50">{comparisonAnalysis.summary}</p>
                            </div>
                            <div>
                               <h3 className="font-semibold text-brand-success mb-1">Improvements</h3>
                               <ul className="list-disc list-inside text-sm text-brand-text-secondary space-y-1 p-3 bg-brand-background rounded-lg border border-brand-border/50">
                                  {comparisonAnalysis.improvements.map((item,i) => <li key={i}>{item}</li>)}
                               </ul>
                            </div>
                            {comparisonAnalysis.regressions?.length > 0 && (
                                <div>
                                   <h3 className="font-semibold text-brand-warning mb-1">Regressions</h3>
                                   <ul className="list-disc list-inside text-sm text-brand-text-secondary space-y-1 p-3 bg-brand-background rounded-lg border border-brand-border/50">
                                      {comparisonAnalysis.regressions.map((item,i) => <li key={i}>{item}</li>)}
                                   </ul>
                                </div>
                            )}
                            <div>
                               <h3 className="font-semibold text-brand-accent-end mb-1">Final Recommendations</h3>
                               <div className="space-y-2">
                                  {comparisonAnalysis.finalRecommendations.map((rec,i) => <div key={i} className="p-3 bg-brand-background rounded-lg border border-brand-border/50"><h4 className="font-semibold text-brand-text-primary">{rec.title}</h4><p className="text-sm text-brand-text-secondary">{rec.description}</p></div>)}
                               </div>
                            </div>
                        </div>
                    )}
                </Step>
            )}
          </div>

          <div className="relative">
             {isCleaningLocked && (
                <div className="absolute inset-0 bg-brand-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl border border-brand-border">
                    <Icon name="lock" className="w-12 h-12 text-brand-warning" />
                    <p className="mt-4 font-semibold text-lg text-brand-text-primary">Complete Step 1 to Unlock</p>
                    <p className="text-brand-text-secondary">Measure your page speed to activate optimization.</p>
                </div>
            )}
            <div className={`flex flex-col gap-6 ${isCleaningLocked ? 'opacity-40 pointer-events-none' : ''}`}>
                <Step number="3" title="Clean Your Post HTML">
                    <p className="text-sm text-brand-text-secondary mb-3">Paste your post's HTML (from the 'Text' or 'Code' editor) below to apply automated cleaning and optimizations.</p>
                    <textarea value={originalHtml} onChange={(e) => setOriginalHtml(e.target.value)} placeholder="Paste the full 'Text' view code of your WP post here..." className="w-full h-48 p-3 bg-brand-background border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent-start focus:border-brand-accent-start focus:outline-none text-sm font-mono transition-colors"/>
                    
                    {aiAppliedNotification && (
                        <div className="mt-3 text-sm text-center p-2 bg-brand-success/10 border border-brand-success/30 text-brand-success rounded-lg transition-opacity duration-300">
                            {aiAppliedNotification}
                        </div>
                    )}

                    <div className="mt-4 space-y-3">
                        <h4 className="font-semibold text-brand-text-secondary text-sm">Basic Cleanup</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <CheckboxOption name="stripComments" label="Strip HTML Comments" checked={options.stripComments} onChange={handleOptionChange} description="Removes <!-- comments -->."/>
                            <CheckboxOption name="collapseWhitespace" label="Collapse Whitespace" checked={options.collapseWhitespace} onChange={handleOptionChange} description="Removes extra spaces."/>
                            <CheckboxOption name="minifyInlineCSSJS" label="Minify Inline CSS/JS" checked={options.minifyInlineCSSJS} onChange={handleOptionChange} description="Minifies code in <style>, <script>."/>
                            <CheckboxOption name="removeEmptyAttributes" label="Remove Empty Attributes" checked={options.removeEmptyAttributes} onChange={handleOptionChange} description="Removes attributes with no value."/>
                        </div>

                        <h4 className="font-semibold text-brand-text-secondary text-sm pt-2">Preservation</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                            <CheckboxOption name="preserveIframes" label="Preserve iFrames" checked={options.preserveIframes} onChange={handleOptionChange} description="Keeps all <iframe> tags untouched."/>
                            <CheckboxOption name="preserveLinks" label="Preserve Links" checked={options.preserveLinks} onChange={handleOptionChange} description="Keeps all <a> tags untouched."/>
                            <CheckboxOption name="preserveShortcodes" label="Preserve Shortcodes" checked={options.preserveShortcodes} onChange={handleOptionChange} description="Keeps WordPress [shortcodes] safe."/>
                        </div>

                        <h4 className="font-semibold text-brand-success text-sm pt-2">Performance Optimizations</h4>
                         <div className="space-y-1">
                            <CheckboxOption name="lazyLoadImages" label="Lazy Load Images" checked={options.lazyLoadImages} onChange={handleOptionChange} isRecommended description="Loads images as they enter the viewport."/>
                            <CheckboxOption name="lazyLoadEmbeds" label="Lazy Load Social Embeds" checked={options.lazyLoadEmbeds} onChange={handleOptionChange} isRecommended description="Replaces YouTube, X, etc., with facades that load on scroll."/>
                            <CheckboxOption name="optimizeFontLoading" label="Optimize Font Loading" checked={options.optimizeFontLoading} onChange={handleOptionChange} isRecommended description="Adds 'display=swap' to Google Fonts to prevent invisible text."/>
                            <CheckboxOption name="addPrefetchHints" label="Add Preconnect Hints" checked={options.addPrefetchHints} onChange={handleOptionChange} isRecommended description="Speeds up connection to domains like Google Fonts."/>
                            <CheckboxOption name="deferScripts" label="Defer Non-Essential JavaScript" checked={options.deferScripts} onChange={handleOptionChange} isRecommended description="Prevents JavaScript from blocking page rendering."/>
                            <CheckboxOption name="optimizeCssLoading" label="Optimize CSS Delivery" checked={options.optimizeCssLoading} onChange={handleOptionChange} isRisky description="Defers non-critical CSS. May cause Flash of Unstyled Content."/>
                            
                            <h5 className="font-semibold text-brand-accent-start text-sm pt-3">Advanced Image Optimizations</h5>
                            <CheckboxOption 
                                name="optimizeImages" 
                                label="Convert Images to Next-Gen Formats" 
                                checked={options.optimizeImages} 
                                onChange={handleOptionChange} 
                                isRecommended 
                                description="Converts images to WebP or AVIF on supported CDNs (e.g., Jetpack, Cloudinary)."
                            />
                            <CheckboxOption 
                                name="convertToAvif" 
                                label="Prefer AVIF over WebP" 
                                checked={options.convertToAvif} 
                                onChange={handleOptionChange}
                                disabled={!options.optimizeImages}
                                description="AVIF offers superior compression but has slightly less browser support."
                            />
                            <CheckboxOption 
                                name="addResponsiveSrcset" 
                                label="Generate Responsive Srcset" 
                                checked={options.addResponsiveSrcset} 
                                onChange={handleOptionChange} 
                                isRecommended 
                                description="Adds srcset and sizes attributes to prevent loading oversized images on small screens."
                            />
                             <CheckboxOption 
                                name="optimizeSvgs" 
                                label="Minify Inline SVGs" 
                                checked={options.optimizeSvgs} 
                                onChange={handleOptionChange} 
                                description="Removes unnecessary data and comments from inline SVG code."
                            />
                             <h5 className="font-semibold text-brand-accent-end text-sm pt-3">Advanced Media Optimizations</h5>
                              <CheckboxOption 
                                  name="progressiveImageLoading" 
                                  label="Progressive Image Loading (Blur-up)" 
                                  checked={options.progressiveImageLoading} 
                                  onChange={handleOptionChange}
                                  disabled={!options.lazyLoadImages}
                                  isRecommended
                                  description="Shows a tiny, blurred placeholder that loads into the full image. Improves perceived speed."
                              />
                              <CheckboxOption 
                                  name="lazyLoadBackgroundImages" 
                                  label="Lazy Load Background Images" 
                                  checked={options.lazyLoadBackgroundImages} 
                                  onChange={handleOptionChange} 
                                  isRecommended 
                                  description="Finds and lazy-loads CSS background images set via inline styles."
                              />
                              <CheckboxOption 
                                  name="optimizeVideoElements" 
                                  label="Optimize HTML5 <video> Elements" 
                                  checked={options.optimizeVideoElements} 
                                  onChange={handleOptionChange}
                                  isRecommended
                                  description="Replaces <video> tags with a lightweight facade that loads on scroll."
                              />
                        </div>
                        
                        <h4 className="font-semibold text-brand-warning text-sm pt-2">Advanced (AI)</h4>
                         <div className="space-y-1">
                            <CheckboxOption 
                                name="semanticRewrite" 
                                label="HTML5 Semantic Rewrite" 
                                checked={options.semanticRewrite} 
                                onChange={handleOptionChange} 
                                description="Rewrites old <b>/<i> tags to modern <strong>/<em>. Does not require an API key."
                            />
                        </div>
                    </div>


                    <button onClick={handleClean} disabled={!originalHtml || isCleaning} className="w-full mt-6 flex items-center justify-center gap-2 py-3 px-4 bg-brand-success/90 hover:bg-brand-success text-white rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-0.5 disabled:bg-brand-surface disabled:text-brand-text-secondary disabled:cursor-not-allowed disabled:transform-none">
                      {isCleaning ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Icon name="magic" className="w-5 h-5" />}
                      Clean & Optimize
                    </button>
                </Step>
                
                {cleanedHtml && impact && (
                    <Step number="4" title="Get Cleaned Code & Compare">
                        <p className="text-sm text-brand-text-secondary mb-3">Your cleaned HTML is ready. Copy it and replace the code in your post editor. Then, click "Compare Speed" in Step 1 to see the results.</p>
                        <div className="relative">
                            <textarea readOnly value={cleanedHtml} className="w-full h-48 p-3 bg-brand-background border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-success focus:outline-none text-sm font-mono transition-colors" />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button onClick={copyToClipboard} title="Copy to Clipboard" className="p-2 bg-brand-surface hover:bg-brand-border rounded-md text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                                    <Icon name={copied ? 'clipboard' : 'clipboard'} className="w-5 h-5" />
                                 </button>
                                <button onClick={downloadHtml} title="Download HTML File" className="p-2 bg-brand-surface hover:bg-brand-border rounded-md text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                                    <Icon name="download" className="w-5 h-5" />
                                </button>
                            </div>
                            {copied && <span className="absolute top-12 right-2 text-xs bg-brand-success text-white px-2 py-1 rounded">Copied!</span>}
                        </div>
                        
                        <h3 className="font-semibold mt-4 mb-2 text-brand-success">Optimization Impact</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-brand-background rounded-lg">
                            {impactMetrics.map(metric => (
                                <div key={metric.label} className="text-center">
                                    <p className="text-xs text-brand-text-secondary">{metric.label}</p>
                                    <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                                </div>
                            ))}
                        </div>
                        {impact.actionLog && impact.actionLog.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-brand-text-secondary text-sm">Actions Performed:</h4>
                                <ul className="list-disc list-inside text-sm text-brand-text-secondary space-y-1 mt-2 p-3 bg-brand-background rounded-lg">
                                    {impact.actionLog.map((log, i) => <li key={i}>{log}</li>)}
                                </ul>
                            </div>
                        )}
                    </Step>
                )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
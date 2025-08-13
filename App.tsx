import { useState, useEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './services/firebase.ts';
import Icon from './components/Icon.tsx';
import SetupGuide from './components/SetupGuide.tsx';
import SessionLog from './components/SessionLog.tsx';
import DigitalClock from './components/DigitalClock.tsx';
import Auth from './components/Auth.tsx';
import VerifyEmail from './components/VerifyEmail.tsx';
import UserProfile from './components/UserProfile.tsx';
import PaywallModal from './components/PaywallModal.tsx';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './services/firebase';
import { useSubscription } from './contexts/SubscriptionContext.tsx';
import { Recommendation, Session, PageSpeedReport } from './types.ts';
import SuccessPage from './components/SuccessPage.tsx';
import CancelPage from './components/CancelPage.tsx';
import DetailedLogPage from './components/DetailedLogPage.tsx';

interface StepProps {
    number: number;
    title: string;
    children: ReactNode;
}

const Step = ({ number, title, children }: StepProps) => (
    <div className="p-6 bg-brand-surface rounded-xl border border-brand-border relative overflow-hidden transition-all duration-300 hover:border-brand-accent-start hover:shadow-lg">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent-start/30 to-transparent"></div>
        <h2 className="text-xl font-semibold mb-4 text-brand-accent-start flex items-center">
            <span className="bg-gradient-to-br from-brand-accent-start to-brand-accent-end text-white rounded-full h-8 w-8 inline-flex items-center justify-center font-bold mr-3 flex-shrink-0">{number}</span>
            {title}
        </h2>
        <div className="pl-11">{children}</div>
    </div>
);

interface ScoreCircleProps {
    score: number;
    size?: number;
}

const ScoreCircle = ({ score, size = 60 }: ScoreCircleProps) => {
    const scoreValue = score ? Math.round(score * 100) : 0;
    const getScoreColor = (s: number) => {
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

interface PageSpeedScoresProps {
    report: { mobile: PageSpeedReport, desktop: PageSpeedReport } | null;
    comparisonReport?: { mobile: PageSpeedReport, desktop: PageSpeedReport } | null;
}

const PageSpeedScores = ({ report, comparisonReport = null }: PageSpeedScoresProps) => {
    if (!report) return null;
    
    const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
    const getCategoryName = (id: string) => id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const renderScores = (data: PageSpeedReport | null, compareData: PageSpeedReport | null = null) => {
      return categories.map(catId => {
        const category = data?.lighthouseResult.categories[catId as keyof typeof data.lighthouseResult.categories];
        if (!category) return null;
        const compareCategory = compareData?.lighthouseResult.categories[catId as keyof typeof compareData.lighthouseResult.categories];
        const scoreDiff = compareCategory ? Math.round(compareCategory.score * 100) - Math.round(category.score * 100) : null;
        
        return (
          <div key={catId} className="text-center p-2 bg-brand-background rounded-lg flex flex-col items-center justify-start h-full" style={{ transform: 'rotateY(-5deg) rotateX(5deg)', transformStyle: 'preserve-3d' }}>
            <p className="text-xs font-semibold text-brand-text-secondary mb-2 h-8 flex items-center text-center justify-center">{getCategoryName(catId)}</p>
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

interface MainAppProps {
    sessionLog: Session[];
    setSessionLog: React.Dispatch<React.SetStateAction<Session[]>>;
}

const MainApp = ({ sessionLog, setSessionLog }: MainAppProps) => {
  const { user, stripeRole, loading: authLoading } = useSubscription();
  const [url, setUrl] = useState('');


  const [isMeasuring, setIsMeasuring] = useState(false);
  const [pageSpeedBefore, setPageSpeedBefore] = useState<{ mobile: PageSpeedReport, desktop: PageSpeedReport } | null>(null);
  const [optimizationPlan, setOptimizationPlan] = useState<Recommendation[] | null>(null);
  const [isGeneratingPlan, ] = useState(false);
  const [apiError, setApiError] = useState('');
  const [sessionLoadError, setSessionLoadError] = useState('');
  const [sessionNotification, setSessionNotification] = useState<string | null>(null);

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  const [userData, setUserData] = useState<{ freeTrialUsage?: number }>({});

  useEffect(() => {
    if (userData && userData.freeTrialUsage !== undefined && userData.freeTrialUsage >= 200 && !stripeRole) {
      setIsPaywallOpen(true);
    }
  }, [userData, stripeRole]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  useEffect(() => {
    if (!user) return;

    const fetchAllUserData = async () => {
        setSessionLoadError('');
        try {
            // Fetch User Data from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data());
            }

            // Fetch API Keys
            const keysResponse = await fetch(`/api/user-data?userId=${user.uid}`);
            if (!keysResponse.ok) {
                 const errorData = await keysResponse.json().catch(() => ({ message: 'Failed to fetch API keys. The server response was not valid JSON.' }));
                 throw new Error(errorData.message || 'Failed to fetch API keys due to a server error.');
            }
            await keysResponse.json();

            // Fetch Session History
            const sessionsResponse = await fetch(`/api/sessions?userId=${user.uid}`);
            if (!sessionsResponse.ok) {
                const errorData = await sessionsResponse.json().catch(() => ({ message: 'Failed to fetch session data.' }));
                throw new Error(errorData.message);
            }
            const { sessions, notification } = await sessionsResponse.json();
            setSessionLog(sessions);
            if (notification) {
                setSessionNotification(notification);
            }
        } catch (error: any) {
            console.error("Failed to load user data:", error);
            setSessionLoadError(`Could not load history or keys: ${error.message}`);
        }
    };

    fetchAllUserData();
  }, [user, setSessionLog]);



  const [comparisonAnalysis, ] = useState<any>(null);

  const handleMeasure = async () => {
    if (!url) { setApiError('Please enter a URL to measure.'); return; }

    setIsMeasuring(true);
    setApiError('');
    setSessionLoadError('');
    setOptimizationPlan(null);
    setPageSpeedBefore(null);
    setSessionStartTime(Date.now());

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/free-measure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urlToScan: url }),
      });

      if (!response.ok) {
        // Attempt to parse JSON, but fall back to text if that fails
        const errorText = await response.text();
        let errorMessage = 'An unknown error occurred.';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to fetch free measurement.';
        } catch (e) {
          // If JSON parsing fails, the response is likely not JSON.
          // It could be an HTML error page from the server.
          console.error("Could not parse error response as JSON:", errorText);
          errorMessage = `A server error occurred. Please check the server logs. (Received non-JSON response)`;
        }
        throw new Error(errorMessage);
      }

      const { pageSpeedReport, optimizationPlan } = await response.json();
      setPageSpeedBefore(pageSpeedReport);
      setOptimizationPlan(optimizationPlan);

      const sessionEndTime = Date.now();
      const sessionDuration = sessionStartTime ? sessionEndTime - sessionStartTime : 0;

      const newSession: Session = {
          id: new Date().toISOString(),
          url,
          startTime: new Date(sessionStartTime!).toISOString(),
          endTime: new Date(sessionEndTime).toISOString(),
          duration: sessionDuration,
          report: pageSpeedReport,
          beforeScores: {
              mobile: pageSpeedReport.mobile?.lighthouseResult.categories.performance.score ?? 0,
              desktop: pageSpeedReport.desktop?.lighthouseResult.categories.performance.score ?? 0,
              accessibility: pageSpeedReport.mobile?.lighthouseResult.categories.accessibility.score ?? 0,
              bestPractices: pageSpeedReport.mobile?.lighthouseResult.categories['best-practices'].score ?? 0,
              seo: pageSpeedReport.mobile?.lighthouseResult.categories.seo.score ?? 0,
          },
          userId: user!.uid,
      };

      const sessionResponse = await fetch(`/api/sessions?userId=${user!.uid}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSession),
      });
      if (!sessionResponse.ok) {
          console.error('Failed to save session.');
      } else {
          const savedSession = await sessionResponse.json();
          setSessionLog(prevSessions => [savedSession, ...prevSessions]);
      }

    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsMeasuring(false);
      setSessionStartTime(null);
    }
  };

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
    return <VerifyEmail user={user} />;
  }

  return (
    <div className="min-h-screen text-brand-text-primary bg-brand-background p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <header className="mb-8 relative">
          <div className="text-center">
             <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-start to-brand-accent-end animate-glow">FastLoad Pro</h1>
            <p className="text-lg text-brand-text-secondary mt-2">Full Performance Analysis & Speed Boost</p>
            <p className="text-brand-text-secondary mt-1">Prod by <span className="font-semibold text-brand-accent-start">Nion</span></p>
          </div>
        </header>
        <div className="absolute top-6 right-6 z-50">
            <UserProfile user={user} userData={userData} onOpenSettings={() => setIsPaywallOpen(true)} onLogout={handleLogout} />
        </div>

        {isPaywallOpen && <PaywallModal onClose={() => setIsPaywallOpen(false)} />}
        
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="mb-2">
              <SetupGuide />
            </div>
            <div className="mb-2">
              {sessionNotification && (
                <div className="mb-4 p-3 bg-brand-warning/10 border border-brand-warning/30 rounded-lg text-sm text-brand-warning">
                  {sessionNotification}
                </div>
              )}
              <SessionLog sessions={sessionLog} setSessions={setSessionLog} userId={user.uid} />
              {sessionLoadError && <p className="mt-2 text-sm text-brand-danger p-3 bg-brand-danger/10 border border-brand-danger/30 rounded-lg">{sessionLoadError}</p>}
            </div>
            <Step number={1} title="Measure Your Page Speed">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-brand-text-secondary">
                        You have {200 - (userData.freeTrialUsage || 0)} free trials remaining.
                    </p>
                    {sessionStartTime && (
                        <div className="flex items-center gap-x-2">
                            <span className="text-sm font-medium text-brand-text-secondary self-center">Active Session:</span>
                            <DigitalClock startTime={new Date(sessionStartTime).toISOString()} onTick={() => {}} />
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <input type="url" value={url} onChange={e => { setUrl(e.target.value); setPageSpeedBefore(null); }} placeholder="https://your-website.com/your-post" className="flex-grow p-3 bg-brand-background border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent-start focus:border-brand-accent-start focus:outline-none text-sm font-mono transition-colors"/>
                    <button onClick={handleMeasure} disabled={isMeasuring || !url || ((userData.freeTrialUsage || 0) >= 200 && !stripeRole)} className="flex items-center justify-center gap-2 w-48 py-3 px-4 bg-gradient-to-r from-brand-accent-start to-brand-accent-end text-white rounded-lg font-semibold transition-all duration-300 transform hover:-translate-y-0.5 disabled:from-brand-surface disabled:to-brand-surface disabled:text-brand-text-secondary disabled:cursor-not-allowed disabled:transform-none">
                      {isMeasuring ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <Icon name="magic" className="w-5 h-5" />}
                      {'Measure Speed'}
                    </button>
                </div>
                {apiError && <p className="mt-2 text-sm text-brand-danger p-3 bg-brand-danger/10 border border-brand-danger/30 rounded-lg">{apiError}</p>}
                {isMeasuring && <p className="text-sm text-center text-brand-text-secondary mt-4 animate-subtle-pulse">Measuring page speed... this can take up to a minute.</p>}
                <PageSpeedScores report={pageSpeedBefore} />
            </Step>

            {(optimizationPlan || comparisonAnalysis || isGeneratingPlan) && (
                <Step number={2} title={comparisonAnalysis ? "Comparison Analysis" : "AI Optimization Plan"}>
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
                                  {comparisonAnalysis.improvements.map((item: string,i: number) => <li key={i}>{item}</li>)}
                               </ul>
                            </div>
                            {comparisonAnalysis.regressions?.length > 0 && (
                                <div>
                                   <h3 className="font-semibold text-brand-warning mb-1">Regressions</h3>
                                   <ul className="list-disc list-inside text-sm text-brand-text-secondary space-y-1 p-3 bg-brand-background rounded-lg border border-brand-border/50">
                                      {comparisonAnalysis.regressions.map((item: string,i: number) => <li key={i}>{item}</li>)}
                                   </ul>
                                </div>
                            )}
                            <div>
                               <h3 className="font-semibold text-brand-accent-end mb-1">Final Recommendations</h3>
                               <div className="space-y-2">
                                  {comparisonAnalysis.finalRecommendations.map((rec: Recommendation,i: number) => <div key={i} className="p-3 bg-brand-background rounded-lg border border-brand-border/50"><h4 className="font-semibold text-brand-text-primary">{rec.title}</h4><p className="text-sm text-brand-text-secondary">{rec.description}</p></div>)}
                               </div>
                            </div>
                        </div>
                    )}
                </Step>
            )}
          </div>
           <div className="flex flex-col gap-6">
              <Step number={3} title="Automatic Optimizations">
                <div className="text-sm text-brand-text-secondary space-y-4">
                  <p>This application now uses a build-time optimization process.</p>
                  <p>
                    All the cleanup and performance enhancements that were previously available here are now
                    <strong className="text-brand-text-primary"> automatically applied</strong> every time your site is deployed.
                    This is a more robust and reliable method that guarantees stability and performance without manual steps.
                  </p>
                  <div className="p-4 bg-brand-background rounded-lg border border-brand-border/50">
                      <h4 className="font-semibold text-brand-success mb-2">What's Being Optimized?</h4>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>HTML comments and whitespace are removed.</li>
                          <li>Inline CSS and JavaScript are minified.</li>
                          <li>Images and embeds are lazy-loaded.</li>
                          <li>Scripts and stylesheets are deferred.</li>
                          <li>And much more...</li>
                      </ul>
                  </div>
                  <p>
                    There are no longer any manual steps to take here. Simply measure your site, see the recommendations,
                    and know that your site is already optimized on every build.
                  </p>
                </div>
              </Step>
            </div>
        </main>
      </div>
    </div>
  );
};

const App = () => {
    const [sessionLog, setSessionLog] = useState<Session[]>([]);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<MainApp sessionLog={sessionLog} setSessionLog={setSessionLog} />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="/cancel" element={<CancelPage />} />
                <Route path="/logs" element={<DetailedLogPage sessions={sessionLog} />} />
            </Routes>
        </Router>
    );
};

export default App;

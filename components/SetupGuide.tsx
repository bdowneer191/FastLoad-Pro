import { useState } from 'react';
import Icon from './Icon';

const SetupGuide = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-brand-surface rounded-xl border border-brand-border">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-lg font-semibold text-left text-brand-warning"
                aria-expanded={isOpen}
                aria-controls="setup-guide-content"
            >
                <span>Setup Guide & API Keys</span>
                <Icon name="chevronDown" className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div
                id="setup-guide-content"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}
            >
                <div className="p-6 border-t border-brand-border text-brand-text-secondary text-sm space-y-6">
                    <div>
                        <h4 className="font-semibold text-brand-text-primary text-base mb-2">How It Works</h4>
                        <p className="mb-3">
                            This tool uses Google's services to analyze your site and AI to provide recommendations. You'll need API keys for these services. Your session history is saved anonymously in your browser and on Vercel's secure storage.
                        </p>
                        
                        <h5 className="font-semibold text-brand-text-primary mt-6">PageSpeed Insights API Key</h5>
                        <ol className="list-decimal list-inside space-y-2 mt-1">
                            <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-brand-accent-start hover:underline">Google Cloud Credentials page</a>.</li>
                            <li>Click "+ CREATE CREDENTIALS" at the top and select "API key". Copy the new key.</li>
                            <li><strong className="text-brand-warning">Important:</strong> You must enable the API. Visit the <a href="https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-brand-accent-start hover:underline">PageSpeed Insights API Library</a> and click "Enable".</li>
                            <li>Paste the key into the app's "PageSpeed API Key" field.</li>
                        </ol>

                        <h5 className="font-semibold text-brand-text-primary mt-4">Gemini API Key (Optional)</h5>
                        <ol className="list-decimal list-inside space-y-2 mt-1">
                            <li>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-accent-start hover:underline">Google AI Studio</a>.</li>
                            <li>Click "Create API key" and copy the generated key.</li>
                            <li>Paste the key into the app's "Gemini API Key" field for AI features.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupGuide;
const CancelPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-brand-background">
            <div className="max-w-md w-full p-8 bg-brand-surface rounded-lg shadow-lg">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-brand-text-primary mb-4">
                    Payment Cancelled
                </h1>

                <p className="text-brand-text-secondary mb-6">
                    Your payment was cancelled. No charges were made to your account. You can try again anytime.
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full px-6 py-3 bg-brand-accent-start text-white rounded-lg font-semibold hover:bg-brand-accent-end transition-colors"
                    >
                        Back to Dashboard
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        className="w-full px-6 py-3 bg-brand-surface border border-brand-border text-brand-text-primary rounded-lg font-semibold hover:bg-brand-background transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CancelPage;

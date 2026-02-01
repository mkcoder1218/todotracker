
import React, { useState } from 'react';
import { isFirebaseConfigured, enableDemoMode } from '../services/firebase';

interface LoginProps {
  onLogin: () => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [error, setError] = useState<{ title: string; message: string; domain?: string; raw?: string } | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      await onLogin();
    } catch (err: any) {
      console.error("Detailed Auth Error:", err);
      
      const errorMessage = err.message || "";
      const currentHostname = window.location.hostname;
      
      // Attempt to extract the domain from the error message string (Firebase usually puts it in parens)
      // Example: "This domain (abc-123.frame.googleusercontent.com) is not authorized..."
      const domainMatch = errorMessage.match(/\(([^)]+)\)/);
      const extractedDomain = domainMatch ? domainMatch[1] : currentHostname;

      if (err.code === 'auth/unauthorized-domain' || errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('domain')) {
        setError({ 
          title: "Domain Not Authorized",
          message: "Your Firebase project is blocking this request. You must authorize this specific web identity in your Firebase console.",
          domain: extractedDomain,
          raw: errorMessage
        });
      } else if (err.code === 'auth/configuration-not-found') {
        setError({ 
          title: "Setup Incomplete",
          message: "Google Sign-in needs to be enabled in your Firebase Authentication settings.",
          domain: extractedDomain
        });
      } else {
        setError({ 
          title: "Authentication Error",
          message: errorMessage || "An unexpected error occurred. Check your connection or configuration.",
          domain: extractedDomain
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const copyToClipboard = () => {
    if (error?.domain) {
      navigator.clipboard.writeText(error.domain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row font-sans selection:bg-indigo-100 bg-slate-50">
      {/* Branding Panel */}
      <div className="hidden md:flex md:w-5/12 bg-indigo-600 items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="max-w-md space-y-8 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">ZenTask AI</h1>
          <p className="text-indigo-100 text-lg font-light leading-relaxed">
            A premium, AI-driven task environment built for modern teams and individuals.
          </p>
        </div>
      </div>

      {/* Login Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 py-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-slate-900">Sign In</h2>
            <p className="text-slate-500">Access your synchronized workspace</p>
          </div>

          <div className="space-y-6">
            {error ? (
              <div className="bg-white border-2 border-red-50 rounded-[2rem] shadow-2xl shadow-red-100/50 p-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{error.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{error.message}</p>
                </div>

                {/* Always show the Domain info if it exists, as it's the primary fix */}
                {error.domain && (
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Copy This Identity:</label>
                      <div className="flex flex-col gap-3">
                        <code className="bg-white px-4 py-3 rounded-xl border border-slate-200 text-indigo-600 font-mono text-xs font-bold break-all text-center">
                          {error.domain}
                        </code>
                        <button 
                          onClick={copyToClipboard}
                          className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
                            copied ? 'bg-green-500 text-white shadow-lg' : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          {copied ? '✓ Hostname Copied' : 'Copy Domain to Clipboard'}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 leading-relaxed">
                      <strong>Fix Instructions:</strong> Go to <strong>Firebase Console</strong> > <strong>Auth</strong> > <strong>Settings</strong> > <strong>Authorized Domains</strong> and add the text copied above.
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleLogin}
                    className="w-full py-4 bg-indigo-50 text-indigo-600 font-bold rounded-2xl text-sm hover:bg-indigo-100 transition-all"
                  >
                    Try Signing In Again
                  </button>
                  <button 
                    onClick={enableDemoMode}
                    className="w-full py-4 text-slate-400 font-bold rounded-2xl text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
                  >
                    Skip and Use Demo Mode
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="group w-full flex items-center justify-center gap-4 px-8 py-5 bg-white border-2 border-slate-200 rounded-[2rem] text-slate-700 font-bold hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                  <span className="text-lg">{isLoggingIn ? 'Connecting...' : 'Continue with Google'}</span>
                </button>

                {!isFirebaseConfigured && (
                  <button 
                    onClick={enableDemoMode}
                    className="w-full py-4 text-slate-400 text-sm font-semibold hover:text-indigo-600 transition-colors"
                  >
                    Launch Demo Preview
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="pt-8 text-center">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.4em]">Productivity Redefined</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

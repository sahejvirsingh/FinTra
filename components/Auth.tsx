

import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, User, Key, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const Auth = () => {
    // The 'otp' view is temporarily disabled as requested.
    const [authView, setAuthView] = useState<'login' | 'signup' /* | 'otp' */>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    // const [otp, setOtp] = useState(''); // State for OTP view
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                // If invalid credentials, suggest signing up
                if (error.message.includes('Invalid login credentials')) {
                    setError('Account not found. Please sign up.');
                    setAuthView('signup');
                } else {
                    throw error;
                }
            }
            // onAuthStateChange in UserContext will handle the redirect on success
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            // Note: For sign-up to work without email verification, you must disable
            // "Confirm email" in your Supabase project's Authentication settings.
            // If it's enabled, the user will be sent a confirmation link.
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;
            
            // If sign-up is successful and email confirmation is disabled,
            // the onAuthStateChange listener will detect the new session and redirect the user.
            // We keep the loading spinner active until the redirect happens.

            // If email confirmation is enabled, inform the user to check their email.
            if (!data.session) {
                setMessage("Account created successfully! Please check your email for a confirmation link to complete the sign-up process.");
                setLoading(false);
            }

        } catch (err: any) {
            if (err.message && err.message.includes('User already registered')) {
                setError('This email is already registered. Please try logging in.');
                setAuthView('login');
            } else {
                setError(err.error_description || err.message);
            }
            setLoading(false);
        }
    };
    
    /*
    // --- OTP Verification Logic (Commented out as per user request) ---
    // To re-enable OTP, uncomment this block, the related UI, and the OTP state variables.
    // You will also need to ensure your Supabase project is configured to send OTPs.
    const [otp, setOtp] = useState('');

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            });
            if (error) throw error;
            // On success, onAuthStateChange in UserContext will trigger a redirect
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        
        try {
            const { error } = await supabase.auth.resend({ type: 'signup', email });
            if (error) throw error;
            setMessage('A new verification code has been sent.');
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    }
    */

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            setError(error.message);
            setLoading(false);
        }
    };
    
    const inputClasses = "w-full bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg pl-12 pr-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors";
    const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";
    const inputIconClasses = "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400";

    const renderLoginView = () => (
        <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label htmlFor="email-login" className={labelClasses}>Email Address</label>
                <div className="relative">
                    <Mail size={20} className={inputIconClasses} />
                    <input type="email" id="email-login" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                </div>
            </div>
            <div>
                <label htmlFor="password-login" className={labelClasses}>Password</label>
                 <div className="relative">
                    <Key size={20} className={inputIconClasses} />
                    <input type="password" id="password-login" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} required />
                </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 px-4 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
            </button>
        </form>
    );

    const renderSignUpView = () => (
         <form onSubmit={handleSignUp} className="space-y-6">
             <div>
                <label htmlFor="fullName" className={labelClasses}>Full Name</label>
                 <div className="relative">
                    <User size={20} className={inputIconClasses} />
                    <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className={inputClasses} required />
                </div>
            </div>
            <div>
                <label htmlFor="email-signup" className={labelClasses}>Email Address</label>
                 <div className="relative">
                    <Mail size={20} className={inputIconClasses} />
                    <input type="email" id="email-signup" value={email} onChange={e => setEmail(e.target.value)} className={inputClasses} required />
                </div>
            </div>
            <div>
                <label htmlFor="password-signup" className={labelClasses}>Password</label>
                 <div className="relative">
                    <Key size={20} className={inputIconClasses} />
                    <input type="password" id="password-signup" value={password} onChange={e => setPassword(e.target.value)} className={inputClasses} required />
                </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 px-4 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </button>
        </form>
    );

    /*
    // --- OTP View (Commented out as per user request) ---
    const renderOtpView = () => (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">
                    A verification code was sent to <br/>
                    <strong className="text-gray-800 dark:text-gray-200">{email}</strong>
                </p>
            </div>
            <div>
                <label htmlFor="otp" className={labelClasses}>Verification Code</label>
                <div className="relative">
                     <CheckCircle size={20} className={inputIconClasses} />
                     <input type="text" id="otp" value={otp} onChange={e => setOtp(e.target.value)} className={inputClasses} required pattern="\d{6}" title="Enter a 6-digit OTP" />
                </div>
            </div>
             <button type="submit" disabled={loading} className="w-full py-3 px-4 text-white bg-indigo-600 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                {loading ? <Loader2 className="animate-spin" /> : 'Verify & Sign In'}
            </button>
            <div className="text-center">
                 <button type="button" onClick={handleResendOtp} disabled={loading} className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 disabled:opacity-50">
                    Resend Code
                 </button>
            </div>
        </form>
    );
    */

    const getViewTitle = () => {
        switch(authView) {
            case 'login': return 'Welcome Back';
            case 'signup': return 'Create an Account';
            // case 'otp': return 'Verify Your Email';
        }
    }
    
    const getViewSubtitle = () => {
        switch(authView) {
            case 'login': return 'Sign in to continue to your dashboard.';
            case 'signup': return 'Get started with FinTra today.';
            // case 'otp': return 'Enter the 6-digit code we sent you.';
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center text-gray-900 dark:text-white mb-4">
                        <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 17.95l-2.12-2.12m0 0l-2.122-2.122M12 17.95l2.12-2.12m0 0l2.122-2.122M12 17.95V21"></path></svg>
                        <span className="ml-3 text-3xl font-bold">FinTra</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{getViewTitle()}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {getViewSubtitle()}
                    </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl">
                    <button onClick={handleGoogleSignIn} disabled={loading} className="w-full flex items-center justify-center py-3 px-4 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <title>Google</title>
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-.97 2.53-2.09 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.94 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                    </button>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                        <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400 text-sm font-semibold">OR</span>
                        <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    
                    {error && <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg flex items-center text-sm"><AlertCircle size={18} className="mr-2.5 flex-shrink-0" />{error}</div>}
                    {message && <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg flex items-center text-sm"><CheckCircle size={18} className="mr-2.5 flex-shrink-0"/>{message}</div>}
                    
                    {authView === 'login' && renderLoginView()}
                    {authView === 'signup' && renderSignUpView()}
                    {/* {authView === 'otp' && renderOtpView()} */}
                    
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        {authView === 'login' ? "Don't have an account?" : "Already have an account?"}
                        <button 
                            onClick={() => { 
                                setAuthView(authView === 'login' ? 'signup' : 'login'); 
                                setError(null); 
                                setMessage(null);
                            }} 
                            className="font-semibold text-indigo-500 hover:text-indigo-600 ml-1"
                        >
                            {authView === 'login' ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
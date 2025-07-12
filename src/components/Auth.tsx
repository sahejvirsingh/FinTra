
import React from 'react';
import { SignIn } from '@clerk/clerk-react';

const Auth = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 font-sans">
             <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center text-gray-900 dark:text-white mb-4">
                        <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M12 17.95l-2.12-2.12m0 0l-2.122-2.122M12 17.95l2.12-2.12m0 0l2.122-2.122M12 17.95V21"></path></svg>
                        <span className="ml-3 text-3xl font-bold">FinTra</span>
                    </div>
                </div>
                <SignIn afterSignInUrl="/" afterSignUpUrl="/" />
            </div>
        </div>
    );
};

export default Auth;

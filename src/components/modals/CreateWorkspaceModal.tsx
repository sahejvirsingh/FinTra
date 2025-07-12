import React, { useState } from 'react';
import { X, Loader2, Users, User } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface CreateWorkspaceModalProps {
    onClose: () => void;
}

type WorkspaceType = 'personal' | 'organization';

const CreateWorkspaceModal = ({ onClose }: CreateWorkspaceModalProps) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<WorkspaceType>('organization');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { createWorkspace } = useWorkspace();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        
        setIsSubmitting(true);
        setError('');
        try {
            await createWorkspace(name, type);
            onClose();
        } catch(err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
            setIsSubmitting(false);
        }
    };

    const inputClasses = "w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none";
    const labelClasses = "text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center"><Users size={20} className="mr-3"/>Create New Workspace</h2>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                     <div>
                        <label className={labelClasses}>Workspace Type</label>
                        <div className="flex gap-4">
                            <button type="button" onClick={() => setType('personal')} className={`flex-1 p-3 rounded-lg border-2 text-center flex items-center justify-center gap-2 ${type === 'personal' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
                                <User size={18} /> Personal
                            </button>
                            <button type="button" onClick={() => setType('organization')} className={`flex-1 p-3 rounded-lg border-2 text-center flex items-center justify-center gap-2 ${type === 'organization' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
                                <Users size={18} /> Organization
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="ws-name" className={labelClasses}>Workspace Name *</label>
                        <input
                            type="text"
                            id="ws-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={inputClasses}
                            placeholder={type === 'organization' ? "e.g., Acme Inc." : "e.g., Side Project"}
                            required
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                     <div className="flex items-center justify-end pt-2">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-semibold text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting || !name.trim()} className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors ml-4 w-40 h-[42px] flex items-center justify-center disabled:opacity-50">
                            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Create Workspace'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateWorkspaceModal;
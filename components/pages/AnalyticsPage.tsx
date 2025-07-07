


import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Defs, Gradient } from 'recharts';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabaseClient';
import { Expense, TopUp } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { useTheme } from '../../hooks/useTheme';
import { Loader2, TrendingUp } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';

type TimeFilter = 'month' | '3-month' | 'year' | 'custom';
type NetWorthDataPoint = { snapshot_date: string; net_worth: number; };

const AnalyticsPage = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [topups, setTopups] = useState<TopUp[]>([]);
    const [netWorthHistory, setNetWorthHistory] = useState<NetWorthDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('year');
    const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' });
    const { profile } = useUser();
    const { theme } = useTheme();
    const { currentWorkspace } = useWorkspace();


    const fetchData = useCallback(async () => {
        if (!profile || !currentWorkspace.id) return;
        setLoading(true);
        setError(null);
        try {
            const expensesPromise = supabase.from('expenses').select('*').eq('workspace_id', currentWorkspace.id);
            const topupsPromise = supabase.from('topups').select('*').eq('workspace_id', currentWorkspace.id);
            
            const now = new Date();
            const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            const netWorthPromise = supabase.rpc('get_net_worth_history', {
                p_workspace_id: currentWorkspace.id,
                p_start_date: yearAgo.toISOString().split('T')[0],
                p_end_date: now.toISOString().split('T')[0],
                p_time_interval: 'month'
            });


            const [
                { data: expensesData, error: expensesError },
                { data: topupsData, error: topupsError },
                { data: netWorthData, error: netWorthError }
            ] = await Promise.all([expensesPromise, topupsPromise, netWorthPromise]);


            if (expensesError) throw new Error(`Expenses: ${expensesError.message}`);
            if (topupsError) throw new Error(`Topups: ${topupsError.message}`);
            if (netWorthError) throw new Error(`Net Worth History: ${netWorthError.message}`);


            setExpenses((expensesData as unknown as Expense[]) || []);
            setTopups((topupsData as unknown as TopUp[]) || []);
            setNetWorthHistory((netWorthData as NetWorthDataPoint[]) || []);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            console.error("Failed to fetch analytics data:", errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [profile, currentWorkspace.id]);

    useEffect(() => {
        if (currentWorkspace.id) {
           fetchData();
        }
    }, [fetchData, currentWorkspace.id]);
    
    const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    const gridColor = theme === 'dark' ? '#374151' : '#e5e7eb';

    const { filteredData, filteredNetWorth } = useMemo(() => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        if (timeFilter === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (timeFilter === '3-month') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        } else if (timeFilter === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else { // 'custom'
            startDate = customDateRange.from ? new Date(customDateRange.from) : new Date(0);
            endDate = customDateRange.to ? new Date(customDateRange.to) : now;
        }

        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
        const filteredTopups = topups.filter(t => {
            const topupDate = new Date(t.topup_time);
            return topupDate >= startDate && topupDate <= endDate;
        });

        const fNetWorth = netWorthHistory.filter(h => {
            const snapshotDate = new Date(h.snapshot_date);
            return snapshotDate >= startDate && snapshotDate <= endDate;
        });

        return { 
            filteredData: { filteredExpenses, filteredTopups },
            filteredNetWorth: fNetWorth
        };
    }, [expenses, topups, netWorthHistory, timeFilter, customDateRange]);

    const { totalExpense, totalIncome, categoryData, spendingOverTimeData, incomeVsExpenseData } = useMemo(() => {
        const { filteredExpenses, filteredTopups } = filteredData;
        const totalExp = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const totalInc = filteredTopups.reduce((sum, t) => sum + t.amount, 0);

        // Category data
        const spendingByCategory: { [key: string]: number } = {};
        filteredExpenses.forEach(exp => {
            spendingByCategory[exp.category] = (spendingByCategory[exp.category] || 0) + exp.amount;
        });
        const catData = Object.entries(spendingByCategory).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

        // Spending over time data
        const spendingByDate: { [date: string]: number } = {};
        filteredExpenses.forEach(exp => {
            const date = new Date(exp.date).toLocaleDateString('en-CA'); // YYYY-MM-DD
            spendingByDate[date] = (spendingByDate[date] || 0) + exp.amount;
        });
        const spendingData = Object.entries(spendingByDate).map(([date, amount]) => ({ date, amount })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Income vs Expense Data
        const incVsExpData = [{ name: 'Financial Flow', income: totalInc, expense: totalExp }];

        return { totalExpense: totalExp, totalIncome: totalInc, categoryData: catData, spendingOverTimeData: spendingData, incomeVsExpenseData: incVsExpData };
    }, [filteredData]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    if (loading || !profile) {
        return <div className="flex items-center justify-center h-full"><Loader2 size={48} className="animate-spin text-indigo-500" /></div>;
    }
    
    if (error) {
        return (
          <div className="flex items-center justify-center h-full bg-red-50 dark:bg-gray-800/50 p-6 rounded-2xl text-red-600 dark:text-red-400">
            <div className="text-center">
                <h3 className="text-lg font-semibold">Could not load analytics</h3>
                <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        );
    }
    
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
                <div className="flex items-center flex-wrap gap-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-full">
                    {(['month', '3-month', 'year', 'custom'] as TimeFilter[]).map(filter => (
                        <button key={filter} onClick={() => setTimeFilter(filter)} className={`px-4 py-1.5 text-sm rounded-full transition-colors font-semibold capitalize ${timeFilter === filter ? 'bg-white dark:bg-gray-800 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>
                           {filter === 'month' ? 'This Month' : filter === '3-month' ? '3 Months' : filter}
                        </button>
                    ))}
                </div>
            </div>

            {timeFilter === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-lg">
                    <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">From</label>
                        <input type="date" value={customDateRange.from} onChange={e => setCustomDateRange(prev => ({...prev, from: e.target.value}))} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg p-2"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 block">To</label>
                        <input type="date" value={customDateRange.to} onChange={e => setCustomDateRange(prev => ({...prev, to: e.target.value}))} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg p-2"/>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"><p className="text-gray-500">Total Income</p><p className="text-3xl font-bold text-green-500">{formatCurrency(totalIncome, profile.currency)}</p></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"><p className="text-gray-500">Total Expenses</p><p className="text-3xl font-bold text-red-500">{formatCurrency(totalExpense, profile.currency)}</p></div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg"><p className="text-gray-500">Net Flow</p><p className={`text-3xl font-bold ${(totalIncome - totalExpense) >= 0 ? 'text-indigo-500' : 'text-orange-500'}`}>{formatCurrency(totalIncome - totalExpense, profile.currency)}</p></div>
            </div>

             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-3"><TrendingUp className="text-indigo-500"/>Net Worth Over Time</h2>
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={filteredNetWorth} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false}/>
                        <XAxis dataKey="snapshot_date" stroke={tickColor} fontSize={12} tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {month: 'short', year:'numeric'})}/>
                        <YAxis stroke={tickColor} fontSize={12} tickFormatter={(val) => formatCurrency(val, profile.currency)} axisLine={false} tickLine={false} width={80}/>
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', border: '1px solid #4b5563', borderRadius: '0.5rem' }} formatter={(value: number) => [formatCurrency(value, profile.currency), 'Net Worth']}/>
                        <Area type="monotone" dataKey="net_worth" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorNetWorth)" strokeWidth={2}/>
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Spending Over Time</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={spendingOverTimeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                        <XAxis dataKey="date" stroke={tickColor} fontSize={12} />
                        <YAxis stroke={tickColor} fontSize={12} tickFormatter={val => formatCurrency(val, profile.currency)} />
                        <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', border: '1px solid #4b5563', borderRadius: '0.5rem' }} formatter={(value: number) => formatCurrency(value, profile.currency)}/>
                        <Legend />
                        <Line type="monotone" dataKey="amount" name="Spending" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Income vs. Expense</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={incomeVsExpenseData} margin={{top: 5, right: 20, left: 20, bottom: 5}}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                            <XAxis dataKey="name" stroke={tickColor} fontSize={12}/>
                            <YAxis stroke={tickColor} fontSize={12} tickFormatter={val => formatCurrency(val, profile.currency)}/>
                            <Tooltip cursor={{fill: theme === 'dark' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(229, 231, 235, 0.4)'}} contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', border: '1px solid #4b5563', borderRadius: '0.5rem' }} formatter={(value: number) => formatCurrency(value, profile.currency)}/>
                            <Legend />
                            <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Spending by Category</h2>
                     {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value, profile.currency)}/>
                                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right"/>
                            </PieChart>
                        </ResponsiveContainer>
                     ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">No category data for this period.</div>
                     )}
                 </div>
            </div>
             {currentWorkspace.type === 'organization' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Project Budget Overview</h2>
                    <div className="flex items-center justify-center h-48 text-gray-500">
                        Project budget charts coming soon...
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;


import React from 'react';
import { X, ShoppingCart, DollarSign, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { AggregatedItem } from '../../types';

interface ItemDetailModalProps {
  item: AggregatedItem;
  currency: string;
  onClose: () => void;
}

const ItemDetailModal = ({ item, currency, onClose }: ItemDetailModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-in fade-in-0">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Package size={24} className="text-gray-600 dark:text-gray-300"/>
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{item.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Purchase History</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl">
                    <DollarSign className="w-8 h-8 text-green-500 mr-4"/>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{formatCurrency(item.totalSpent, currency)}</p>
                    </div>
                </div>
                <div className="flex items-center bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl">
                    <ShoppingCart className="w-8 h-8 text-indigo-500 mr-4"/>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Quantity</p>
                        <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{item.totalQuantity}</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Purchase Instances ({item.occurrences.length})</h3>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg max-h-80 overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="text-left font-medium p-3">Date</th>
                                <th className="text-left font-medium p-3">Store / Memo</th>
                                <th className="text-center font-medium p-3 w-16">Qty</th>
                                <th className="text-right font-medium p-3 w-28">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {item.occurrences.sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()).map(occurrence => (
                            <tr key={occurrence.id}>
                                <td className="p-3 text-gray-600 dark:text-gray-300">{new Date(occurrence.expenseDate).toLocaleDateString()}</td>
                                <td className="p-3 text-gray-800 dark:text-gray-200 font-medium">{occurrence.expenseTitle}</td>
                                <td className="p-3 text-center text-gray-600 dark:text-gray-400">{occurrence.quantity}</td>
                                <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">{formatCurrency(occurrence.price, currency)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ItemDetailModal;

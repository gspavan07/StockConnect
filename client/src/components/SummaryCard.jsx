import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const SummaryCard = ({ title, value, subValue, isPositive, prefix = '₹' }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <span className="text-3xl font-bold text-gray-900">
          {prefix}{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      {subValue && (
        <div className={`mt-2 flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span className="ml-1 font-medium">
            {prefix}{Math.abs(subValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;

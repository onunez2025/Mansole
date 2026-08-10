import React from 'react';

export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table className={`w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }) {
  return (
    <thead className="bg-neutral-50 dark:bg-neutral-800">
      {children}
    </thead>
  );
}

export function TableBody({ children }) {
  return (
    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
      {children}
    </tbody>
  );
}

export function TableHeader({ children, className = '' }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 ${className}`}>
      {children}
    </th>
  );
}

export function TableRow({ children, className = '' }) {
  return (
    <tr className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-smooth ${className}`}>
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300 ${className}`}>
      {children}
    </td>
  );
}

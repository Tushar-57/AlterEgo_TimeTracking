import React from 'react';

export const Input = ({
    label, type = 'text', value, onChange, required
  }: {
    label: string;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
  }) => (
    <div className="flex flex-col">
      <label className="text-sm mb-1">{label}</label>
      <input 
        type={type}
        className="p-2 border rounded"
        value={value}
        onChange={onChange}
        required={required}
      />
    </div>
  );

  export const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <table className={`w-full ${className}`}>{children}</table>
  );
  Table.Header = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <thead className={className}>{children}</thead>
  );
  Table.Body = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <tbody className={className}>{children}</tbody>
  );
  Table.Row = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <tr className={`border-t ${className}`}>{children}</tr>
  );
  Table.Head = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <th className={`text-left p-3 text-sm font-medium ${className}`}>{children}</th>
  );
  Table.Cell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <td className={`p-3 ${className}`}>{children}</td>
  );
  export const Button = ({ 
    variant, 
    className, 
    children, 
    size,
    ...props 
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    variant?: 'primary' | 'ghost';
    size?: 'icon' | 'default';
  }) => (
    <button 
      className={`px-4 py-2 rounded transition-all ${
        variant === 'primary' 
          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg' 
          : variant === 'ghost' 
          ? 'text-gray-600 hover:bg-gray-100 border border-gray-300 hover:border-gray-400'
          : 'bg-gray-100 hover:bg-gray-200'
      } ${
        size === 'icon' ? 'p-2 aspect-square' : 'px-4 py-2'
      } ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
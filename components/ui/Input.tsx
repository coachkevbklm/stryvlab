import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = ({
  label,
  error,
  className = '',
  ...props
}: InputProps) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {/* LABEL : Typographie secondaire (13px) */}
      {label && (
        <label className="ml-4 text-[13px] text-secondary font-medium">
          {label}
        </label>
      )}

      {/* INPUT : Volume Négatif (Inset) */}
      <input
        className={`
          w-full px-5 py-3
          bg-surface-light 
          text-primary placeholder:text-muted
          rounded-widget
          shadow-soft-in
          border-none outline-none
          transition-all duration-200
          focus:ring-2 focus:ring-accent/10
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />

      {/* ERROR MESSAGE */}
      {error && (
        <span className="ml-4 text-[12px] text-red-500 font-medium">
          {error}
        </span>
      )}
    </div>
  );
};
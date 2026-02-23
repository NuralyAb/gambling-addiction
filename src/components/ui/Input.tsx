"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full px-4 py-2.5 bg-dark-lighter border rounded-lg text-slate-200 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors
            ${error ? "border-red-500" : "border-dark-border"} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;

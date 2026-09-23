import React, { useId } from 'react';

/**
 * Reusable Accessible Input Component
 * Dark luxury styling with support for icons, helper texts, and validation errors.
 */
const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  wrapperClassName = '',
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  return (
    <div className={`w-full space-y-1.5 ${wrapperClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block typography-label text-surface-200"
        >
          {label} {required && <span className="text-brand-red">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3.5 pointer-events-none text-muted-foreground flex items-center justify-center">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          className={`
            w-full bg-background-elevated border text-surface-100 placeholder-muted-foreground
            rounded-card text-sm font-sans px-4 py-3 min-h-[44px]
            transition-all duration-200 outline-none
            focus:border-brand-red focus:ring-1 focus:ring-brand-red
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${error ? 'border-rose-600 focus:border-rose-600 focus:ring-rose-600' : 'border-border'}
            ${className}
          `}
          {...props}
        />

        {Icon && iconPosition === 'right' && (
          <div className="absolute right-3.5 pointer-events-none text-muted-foreground flex items-center justify-center">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} className="text-xs text-rose-500 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default Input;

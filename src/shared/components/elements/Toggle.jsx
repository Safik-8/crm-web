import React from 'react';

/**
 * Reusable Toggle Switch Component.
 * Styled with Tailwind CSS for Linear/Stripe design aesthetics.
 */
export const Toggle = ({ checked, onChange, label, disabled = false, id }) => {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-zinc-700 select-none">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 ${
          checked ? 'bg-orange-500' : 'bg-zinc-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};

export default Toggle;

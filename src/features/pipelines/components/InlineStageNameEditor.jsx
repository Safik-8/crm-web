import { useEffect, useRef } from 'react';
import { Loader2, Check, X } from 'lucide-react';

/**
 * Inline text input with explicit Save / Cancel action buttons.
 * Auto-focuses and selects all text on mount.
 */
const InlineStageNameEditor = ({
  value,
  onChange,
  onCommit,
  onCancel,
  loading = false,
  className = '',
}) => {
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onCommit(); }
    else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
  };

  return (
    <div className={`flex items-center gap-2 flex-1 min-w-0 ${className}`}>
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        spellCheck={false}
        className={`
          flex-1 min-w-0 text-sm font-bold tracking-tight bg-white
          border rounded-lg px-2.5 py-1 outline-none transition-all duration-150
          text-slate-900 placeholder-slate-300
          ${loading
            ? 'border-slate-200 text-slate-400 cursor-not-allowed'
            : 'border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/15'
          }
        `}
        aria-label="Rename stage"
      />

      {/* Save button */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCommit}
        disabled={loading}
        title="Save (Enter)"
        aria-label="Save rename"
        className="
          flex-shrink-0 flex items-center justify-center gap-1.5
          h-7 px-2.5 rounded-lg text-xs font-bold
          bg-emerald-500 hover:bg-emerald-600 text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          active:scale-95 transition-all shadow-sm
        "
      >
        {loading
          ? <Loader2 size={12} className="animate-spin" />
          : <Check size={13} strokeWidth={3} />
        }
        <span>Save</span>
      </button>

      {/* Cancel button — icon only */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
        disabled={loading}
        title="Cancel (Esc)"
        aria-label="Cancel rename"
        className="
          flex-shrink-0 flex items-center justify-center
          h-7 w-7 rounded-lg
          bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600
          disabled:opacity-40 disabled:cursor-not-allowed
          active:scale-95 transition-all
        "
      >
        <X size={14} strokeWidth={3} />
      </button>
    </div>
  );
};

export default InlineStageNameEditor;

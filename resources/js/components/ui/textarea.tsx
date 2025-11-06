import * as React from "react";
import { cn } from "@/lib/utils";

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  // Preserve the initial rendered height (e.g., from rows or CSS) so we never shrink below it
  if (!el.dataset.initialHeight) {
    el.dataset.initialHeight = String(el.clientHeight || 0);
  }

  const computed = window.getComputedStyle(el);
  const minH = parseFloat(computed.minHeight || "0") || 0;
  const base = parseFloat(el.dataset.initialHeight) || 0;

  // Reset height to auto to measure scrollHeight accurately, then set to max of content, min-height, and initial height
  el.style.height = "auto";
  const target = Math.max(el.scrollHeight, minH, base);
  el.style.height = `${target}px`;
}

async function copyToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {}
  // Fallback for older browsers
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "absolute";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(ta);
  }
}

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, onInput, onKeyDown, onChange, value, defaultValue, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Merge external ref with internal ref
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    // Auto-size on mount and when controlled value/defaultValue changes
    React.useEffect(() => {
      autoResize(innerRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, defaultValue]);

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      autoResize(e.currentTarget);
      onInput?.(e);
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;
      const key = e.key.toLowerCase();
      if (key !== 'x' && key !== 'c') return;
      const el = innerRef.current;
      if (!el) return;
      const v = el.value;
      const selStart = el.selectionStart ?? 0;
      const selEnd = el.selectionEnd ?? 0;
      // Only intercept when no selection
      if (selStart !== selEnd) return;

      // Determine current line bounds
      const lineStart = (v.lastIndexOf('\n', Math.max(0, selStart - 1)) + 1) || 0;
      let lineEnd = v.indexOf('\n', selStart);
      if (lineEnd === -1) lineEnd = v.length;
      const lineText = v.slice(lineStart, lineEnd);

      // Perform copy of the current line
      await copyToClipboard(lineText);
      // Ensure focus remains on the textarea (fallback copy may steal focus)
      try { el.focus({ preventScroll: true } as any); } catch { el.focus(); }
      e.preventDefault();

      if (key === 'x') {
        // For cut: remove the line and its trailing newline if present
        const hasTrailingNewline = lineEnd < v.length && v.charAt(lineEnd) === '\n';
        const removeEnd = hasTrailingNewline ? lineEnd + 1 : lineEnd;
        const newValue = v.slice(0, lineStart) + v.slice(removeEnd);

        // Update value for controlled/uncontrolled usage
        if (typeof value !== 'undefined' && onChange) {
          const fakeEvent = {
            target: Object.assign(el, { value: newValue }),
            currentTarget: Object.assign(el, { value: newValue }),
          } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
          onChange(fakeEvent);
        } else {
          el.value = newValue;
        }
        // Restore caret to start of the next line (now at previous lineStart)
        requestAnimationFrame(() => {
          try {
            el.selectionStart = el.selectionEnd = lineStart;
            autoResize(el);
          } catch {}
        });
      } else {
        // Copy only: keep caret at the same logical position
        requestAnimationFrame(() => {
          try {
            el.selectionStart = el.selectionEnd = selStart;
          } catch {}
        });
      }
    };

    return (
      <textarea
        ref={innerRef}
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex min-h-[120px] w-full min-w-0 rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          // Ensure autosize looks clean and user doesn't manually resize conflicting with JS
          "overflow-hidden resize-none",
          className
        )}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onChange={onChange}
        value={value}
        defaultValue={defaultValue}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };

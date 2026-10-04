"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Leading icon rendered inside the field, matching the other auth inputs. */
  icon?: ReactNode;
};

/**
 * Password field with a reveal toggle. Kept as a component so login, register
 * and reset-password all behave identically instead of each page rolling its own.
 */
export default function PasswordInput({
  icon,
  className = "",
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#666666]">
          {icon}
        </span>
      ) : null}

      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`input ${icon ? "pl-10" : ""} pr-11 font-mono ${className}`.trim()}
      />

      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center text-[#666666] transition-colors hover:text-[#52a8ff] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#52a8ff]"
      >
        <Icon className="h-4 w-4" />
      </button>
    </div>
  );
}
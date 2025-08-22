"use client";

import { CSSProperties, ReactNode } from "react";

export default function ConfirmSubmitButton({
  children,
  confirmMessage,
  className,
  style,
}: {
  children: ReactNode;
  confirmMessage?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}


import type { ReactNode } from "react";

export default function Card({
  title,
  footer,
  children,
}: {
  title: string;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border rounded p-4">
      <h2 className="font-medium">{title}</h2>
      {children && <div className="mt-2">{children}</div>}
      {footer && <div className="mt-4 flex gap-2">{footer}</div>}
    </div>
  );
}

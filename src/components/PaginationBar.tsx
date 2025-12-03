"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function PaginationBar({
  total,
  limit,
  page,
}: {
  total: number;
  limit: number;
  page: number;
}) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const last = Math.max(1, Math.ceil(total / limit));

  const go = (p: number) => {
    const params = new URLSearchParams(sp?.toString() ?? "");
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-6 my-3">
      <button
        className="px-3 py-1 border rounded"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      >
        ← Prev
      </button>
      <span>Pagina {page} / {last} • {total} righe</span>
      <button
        className="px-3 py-1 border rounded"
        disabled={page >= last}
        onClick={() => go(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}

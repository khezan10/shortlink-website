import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Link tidak ditemukan — mzg.my.id",
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        textAlign: "center",
        padding: 24,
      }}
    >
      <p style={{ color: "#b4ff2b", letterSpacing: "0.3em", fontSize: "0.75rem" }}>
        404
      </p>
      <h1 style={{ fontFamily: "var(--font-display, monospace)", fontSize: "1.8rem" }}>
        Link tidak ditemukan_
      </h1>
      <p style={{ color: "#a8a8a8", fontSize: "0.9rem" }}>
        Link tidak ditemukan atau sudah dihapus.
      </p>
      <Link href="/" style={{ color: "#b4ff2b", fontSize: "0.9rem" }}>
        &gt; buat link baru
      </Link>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Link not found — mzg.my.id",
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
        Link not found_
      </h1>
      <p style={{ color: "#a8a8a8", fontSize: "0.9rem" }}>
        This link does not exist or was already removed.
      </p>
      <Link href="/" style={{ color: "#b4ff2b", fontSize: "0.9rem" }}>
        &gt; create a new link
      </Link>
    </main>
  );
}

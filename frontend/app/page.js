"use client";

export default function Home() {
  return (
    <main style={{ padding: "3rem", maxWidth: 720, margin: "0 auto" }}>
      <h1>Sessions Marketplace</h1>
      <p>Scaffold is up. Feature pages coming next:</p>
      <ul>
        <li>Home / Catalog</li>
        <li>Session Detail</li>
        <li>Auth Flow (GitHub OAuth)</li>
        <li>User Dashboard</li>
        <li>Creator Dashboard</li>
      </ul>
      <p style={{ color: "#666" }}>
        API base: <code>{process.env.NEXT_PUBLIC_API_BASE_URL || "(unset)"}</code>
      </p>
    </main>
  );
}

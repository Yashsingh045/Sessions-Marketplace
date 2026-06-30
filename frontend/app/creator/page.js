"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Loading } from "../../components/ui";

// The creator dashboard now lives on the single role-aware /dashboard route.
// Keep /creator as a redirect so existing links/bookmarks still work.
export default function CreatorRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="container">
      <Loading label="Redirecting…" />
    </div>
  );
}

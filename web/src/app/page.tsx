"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchHealth } from "@/lib/api";
import { StatusMessage } from "@/components/StatusMessage";

export default function Home(): React.JSX.Element {
  const [healthText, setHealthText] = useState("Checking backend health...");
  const [tone, setTone] = useState<"info" | "success" | "error">("info");

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const ok = await fetchHealth();
        if (!mounted) {
          return;
        }
        if (ok) {
          setHealthText("Backend reachable at /health.");
          setTone("success");
        } else {
          setHealthText("Backend responded but health payload was unexpected.");
          setTone("error");
        }
      } catch (error) {
        if (!mounted) {
          return;
        }
        setHealthText(error instanceof Error ? error.message : "Backend health check failed.");
        setTone("error");
      }
    }
    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="stack">
      <div className="card stack">
        <h2 className="title">Website Test Frontend</h2>
        <p className="subtitle">
          This web MVP mirrors the core product flow: bootstrap user, upload clothing, view closet,
          and run try-on generation.
        </p>
        <StatusMessage message={healthText} tone={tone} />
      </div>

      <div className="card stack">
        <h3>Start Here</h3>
        <div className="row gap-md wrap">
          <Link className="button" href="/upload">
            Upload Clothing
          </Link>
          <Link className="button secondary" href="/closet">
            Open Closet
          </Link>
          <Link className="button secondary" href="/styling">
            Test Styling / Try-On
          </Link>
        </div>
      </div>
    </section>
  );
}

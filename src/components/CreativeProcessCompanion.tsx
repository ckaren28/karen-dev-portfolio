import React, { useMemo, useState } from "react";

type Concept = {
  title: string;
  premise: string;
  steps: string[];
  risk: string;
  stretch: string;
};

type Output = {
  concepts: Concept[];
  constraints: string[];
  materials: string[];
  plan: string[];
  critique_questions: string[];
};

const mediums = ["fashion", "painting", "installation", "film", "creative coding", "writing"] as const;
const moods = ["quiet", "playful", "tense", "tender", "bold", "melancholic", "curious"] as const;

function clsx(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function CreativeProcessCompanion() {
  const [medium, setMedium] = useState<(typeof mediums)[number]>("fashion");
  const [theme, setTheme] = useState("");
  const [mood, setMood] = useState<(typeof moods)[number]>("curious");
  const [context, setContext] = useState("");
  const [grounded, setGrounded] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<Output | null>(null);

  const canSubmit = useMemo(() => theme.trim().length >= 3, [theme]);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const resp = await fetch("/.netlify/functions/creative-process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medium, theme, mood, context, grounded }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Request failed.");
      setOut(data);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setOut(null);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  function copyConcept(c: Concept) {
    const t = [
      c.title,
      "",
      c.premise,
      "",
      "Steps:",
      ...c.steps.map((s) => `- ${s}`),
      "",
      `Risk: ${c.risk}`,
      `Stretch: ${c.stretch}`,
    ].join("\n");
    copy(t);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Inputs</h3>
        <p className="mt-1 text-sm text-zinc-600">Pick a medium, set a theme, and generate three distinct directions.</p>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Medium</span>
            <select
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={medium}
              onChange={(e) => setMedium(e.target.value as any)}
            >
              {mediums.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Theme (required)</span>
            <input
              className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="e.g., memory & repair, public intimacy, machine-made folklore…"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Mood</span>
            <select
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={mood}
              onChange={(e) => setMood(e.target.value as any)}
            >
              {moods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Context (optional)</span>
            <input
              className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="gallery wall text, class assignment, community workshop…"
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={grounded} onChange={(e) => setGrounded(e.target.checked)} />
            Grounded mode (no invented references)
          </label>

          <button
            disabled={!canSubmit || loading}
            onClick={generate}
            className={clsx(
              "mt-2 inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition",
              canSubmit && !loading
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "bg-zinc-200 text-zinc-500 cursor-not-allowed"
            )}
          >
            {loading ? "Generating…" : "Generate directions"}
          </button>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Output</h3>
        <p className="mt-1 text-sm text-zinc-600">Three directions + constraints + a mini plan you can actually follow.</p>

        {!out && !loading && (
          <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
            Generate to see concepts, constraints, materials, a 7-day plan, and critique questions.
          </div>
        )}

        {out && (
          <div className="mt-6 space-y-8">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-800">Concept directions</h4>
              {out.concepts.map((c, i) => (
                <div key={i} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{c.title}</div>
                      <div className="mt-1 text-sm text-zinc-700">{c.premise}</div>
                    </div>
                    <button className="text-xs font-semibold underline text-zinc-700 hover:text-zinc-900" onClick={() => copyConcept(c)}>
                      Copy
                    </button>
                  </div>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                    {c.steps.map((s, idx) => <li key={idx}>{s}</li>)}
                  </ul>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-700">
                    <div><span className="font-semibold">Risk:</span> {c.risk}</div>
                    <div><span className="font-semibold">Stretch:</span> {c.stretch}</div>
                  </div>
                </div>
              ))}
            </div>

            <TwoCol titleLeft="Constraints" itemsLeft={out.constraints} titleRight="Materials / techniques" itemsRight={out.materials} />

            <ListCard title="7-day mini plan" items={out.plan} />
            <ListCard title="Critique questions" items={out.critique_questions} />
          </div>
        )}
      </div>
    </div>
  );
}

function TwoCol({
  titleLeft,
  itemsLeft,
  titleRight,
  itemsRight,
}: {
  titleLeft: string;
  itemsLeft: string[];
  titleRight: string;
  itemsRight: string[];
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ListCard title={titleLeft} items={itemsLeft} />
      <ListCard title={titleRight} items={itemsRight} />
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-zinc-200 p-4">
      <h4 className="text-sm font-semibold text-zinc-800">{title}</h4>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
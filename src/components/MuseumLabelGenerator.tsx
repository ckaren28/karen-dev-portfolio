import React, { useMemo, useState } from "react";

type Output = {
  wall_label: string;
  extended_label: string;
  kids_label: string;
  audio_guide_script: string;
  alt_text: string;
  curator_notes: string[]; // bullets
  variations: string[];    // alt wall labels
};

const tones = ["neutral", "warm", "playful", "academic"] as const;

function clsx(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}

export default function MuseumLabelGenerator() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [year, setYear] = useState("");
  const [medium, setMedium] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState<(typeof tones)[number]>("neutral");
  const [stayClose, setStayClose] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [out, setOut] = useState<Output | null>(null);

  const canSubmit = useMemo(() => description.trim().length >= 30, [description]);

  async function generate() {
    setError(null);
    setOut(null);
    setLoading(true);

    try {
      const resp = await fetch("/.netlify/functions/museum-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          year,
          medium,
          description,
          tone,
          stayCloseToSource: stayClose,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Request failed.");

      setOut(data);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Form */}
      <div className="rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Artwork info</h3>
        <p className="mt-1 text-sm text-zinc-600">
          Paste a source description. The tool will avoid inventing facts.
        </p>

        <div className="mt-5 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-700">Title (optional)</span>
              <input
                className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled (Blue Study)"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-700">Artist (optional)</span>
              <input
                className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Bridget Riley"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-700">Year (optional)</span>
              <input
                className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="1964"
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-zinc-700">Medium / Materials (optional)</span>
              <input
                className="rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="Oil on canvas"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-zinc-700">Source description (required)</span>
            <textarea
              className="min-h-[160px] rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the visitor sees, any known context, and what you want to emphasize..."
            />
            <span className="text-xs text-zinc-500">
              Tip: 2–6 sentences works best.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-zinc-700">
              Tone{" "}
              <select
                className="ml-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
              >
                {tones.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={stayClose}
                onChange={(e) => setStayClose(e.target.checked)}
              />
              Stay close to source text
            </label>
          </div>

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
            {loading ? "Generating…" : "Generate labels"}
          </button>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="rounded-2xl border border-zinc-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Output</h3>
        <p className="mt-1 text-sm text-zinc-600">
          You can copy individual sections for drafts and iteration.
        </p>

        {!out && !loading && (
          <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
            Generate to see wall label drafts, alt text, and curator notes here.
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
            Working…
          </div>
        )}

        {out && (
          <div className="mt-6 space-y-6">
            <Section title="Wall label (50–70 words)" text={out.wall_label} onCopy={copy} />
            <Section title="Extended label (150–200 words)" text={out.extended_label} onCopy={copy} />
            <Section title="Kids label" text={out.kids_label} onCopy={copy} />
            <Section title="Audio guide script" text={out.audio_guide_script} onCopy={copy} />
            <Section title="Alt text" text={out.alt_text} onCopy={copy} />

            <div>
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-sm font-semibold text-zinc-800">Curator notes</h4>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {out.curator_notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-zinc-800">Variations (alternate wall labels)</h4>
              <div className="mt-2 space-y-3">
                {out.variations.map((v, i) => (
                  <div key={i} className="rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-zinc-800">Option {i + 1}</span>
                      <button
                        className="text-xs font-semibold text-zinc-700 underline hover:text-zinc-900"
                        onClick={() => copy(v)}
                      >
                        Copy
                      </button>
                    </div>
                    <p className="mt-2 leading-6">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  text,
  onCopy,
}: {
  title: string;
  text: string;
  onCopy: (t: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-semibold text-zinc-800">{title}</h4>
        <button
          className="text-xs font-semibold text-zinc-700 underline hover:text-zinc-900"
          onClick={() => onCopy(text)}
        >
          Copy
        </button>
      </div>
      <p className="mt-2 rounded-xl bg-zinc-50 p-3 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">
        {text}
      </p>
    </div>
  );
}
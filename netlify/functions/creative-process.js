export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server missing ANTHROPIC_API_KEY." }) };
    }

    const body = JSON.parse(event.body || "{}");
    const {
      medium = "fashion",
      theme = "",
      mood = "curious",
      context = "",
      grounded = true,
    } = body;

    if (!theme || String(theme).trim().length < 3) {
      return { statusCode: 400, body: JSON.stringify({ error: "Theme is required." }) };
    }

    const system = `
You are a creative studio mentor. Help the user generate original directions and next steps.

Constraints:
- Be specific, not generic.
- Do not invent real people, exhibitions, or artworks as references.
- Keep suggestions aligned to the chosen medium and theme.
- Return valid JSON only (no markdown, no commentary).
`;

    const groundingRule = grounded
      ? "Grounded mode: do not name real artists, exhibitions, or artworks. If you need references, describe them generically (e.g., 'mid-century optical abstraction')."
      : "You may include general references, but do not invent facts or cite fake sources.";

    const user = `
Medium: ${medium}
Theme: ${theme}
Mood: ${mood}
Context: ${context || "unspecified"}
${groundingRule}

Return JSON with keys:
concepts (array of 3), constraints (array), materials (array), plan (array of 7 items), critique_questions (array).

Each concept must include:
- title (short)
- premise (1-2 sentences)
- steps (array of 4-6 bullet strings)
- risk (1 sentence: what could go wrong)
- stretch (1 sentence: a bolder version)

Constraints: 5 items
Materials/techniques: 6 items (tailored to the medium)
Plan: 7 items, day-by-day, concrete actions
Critique questions: 8 questions, studio-style
`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        temperature: 0.7,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    const raw = await resp.json();
    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: raw?.error?.message || "Anthropic API error." }) };
    }

    const text = (raw?.content || [])
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join("\n")
      .trim();

    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let data;
    try {
      data = JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      if (start >= 0 && end > start) data = JSON.parse(cleaned.slice(start, end + 1));
      else return { statusCode: 500, body: JSON.stringify({ error: "Model returned invalid JSON. Try again." }) };
    }

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error." }) };
  }
}
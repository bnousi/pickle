import { NextRequest, NextResponse } from 'next/server';

const CATEGORIES = [
  'produce', 'dairy', 'meat', 'fish', 'deli', 'bakery', 'pasta', 'grains',
  'legumes', 'oils', 'canned', 'spices', 'spreads', 'baking', 'snacks',
  'frozen', 'water', 'juices', 'coffee', 'alcohol', 'hygiene', 'cleaning', 'home',
];

export async function POST(req: NextRequest) {
  const { image, mimeType } = await req.json() as { image: string; mimeType: string };

  const prompt = `Analyze this Greek supermarket receipt. Extract every line item with its individual price.

Return ONLY valid JSON (no markdown, no explanation):
{
  "store": "store name or null",
  "total": total amount as number,
  "items": [
    { "name": "product name as printed", "price": price as number, "category": "category" }
  ]
}

Rules:
- name: use the exact product name as printed on the receipt (Greek is fine)
- price: the final price of that line item (after any quantity multiplication)
- category: must be exactly one of: ${CATEGORIES.join(', ')}
- If a line has unclear/unreadable price, skip it
- Do not include the total line as an item`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType || 'image/jpeg', data: image } },
          ],
        }],
        generationConfig: { temperature: 0.1 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json() as { candidates?: { content: { parts: { text: string }[] } }[] };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  try {
    const clean = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    const result = JSON.parse(clean) as { store: string | null; total: number; items: { name: string; price: number; category: string }[] };
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'parse_error', raw }, { status: 500 });
  }
}

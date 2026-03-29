export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const { context } = await req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      tools: [{
        name: 'create_pest_watch',
        description: 'Create pest and disease watch list',
        input_schema: {
          type: 'object',
          properties: {
            pestWatch: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['insect', 'disease', 'wildlife'] },
                  affects: { type: 'array', items: { type: 'string' } },
                  symptoms: { type: 'string' },
                  prevention: { type: 'string' },
                  organicTreatment: { type: 'string' },
                  conventionalTreatment: { type: 'string' },
                  severity: { type: 'string', enum: ['low', 'medium', 'high'] }
                },
                required: ['name', 'type', 'affects', 'symptoms', 'prevention', 'organicTreatment', 'conventionalTreatment', 'severity']
              }
            }
          },
          required: ['pestWatch']
        }
      }],
      tool_choice: { type: 'tool', name: 'create_pest_watch' },
      messages: [{
        role: 'user',
        content: `You are an expert master gardener. Create a pest and disease watch list with 4-6 entries most relevant to this specific plant list and region.\n\n${context}`
      }]
    })
  });

  const data = await response.json();
  if (!response.ok) return new Response(JSON.stringify({ error: data.error }), { status: response.status, headers: { 'Content-Type': 'application/json' } });

  const toolUse = data.content.find(b => b.type === 'tool_use');
  if (!toolUse) return new Response(JSON.stringify({ error: { message: 'No tool response' } }), { status: 500, headers: { 'Content-Type': 'application/json' } });

  return new Response(JSON.stringify(toolUse.input), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

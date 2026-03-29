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
        name: 'create_shopping_tips',
        description: 'Create shopping list and pro tips',
        input_schema: {
          type: 'object',
          properties: {
            shoppingList: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string', enum: ['seeds', 'amendments', 'tools', 'infrastructure'] },
                  item: { type: 'string' },
                  qty: { type: 'string' },
                  estimatedCost: { type: 'string' },
                  brand: { type: 'string' },
                  searchTerm: { type: 'string' },
                  whereToBuy: { type: 'string' }
                },
                required: ['category', 'item', 'qty', 'estimatedCost', 'brand', 'searchTerm', 'whereToBuy']
              }
            },
            shoppingTotal: { type: 'string' },
            proTips: { type: 'array', items: { type: 'string' } }
          },
          required: ['shoppingList', 'shoppingTotal', 'proTips']
        }
      }],
      tool_choice: { type: 'tool', name: 'create_shopping_tips' },
      messages: [{
        role: 'user',
        content: `You are an expert master gardener. Create a comprehensive shopping list covering seeds, amendments, tools, and infrastructure for this garden. Include 5 specific pro tips.\n\n${context}`
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

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
        name: 'create_garden_calendar',
        description: 'Create a month by month planting calendar',
        input_schema: {
          type: 'object',
          properties: {
            calendar: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  month: { type: 'string' },
                  monthNum: { type: 'number' },
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        text: { type: 'string' },
                        type: { type: 'string', enum: ['sow', 'plant', 'harvest', 'pest', 'general'] },
                        plants: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['text', 'type', 'plants']
                    }
                  }
                },
                required: ['month', 'monthNum', 'tasks']
              }
            }
          },
          required: ['calendar']
        }
      }],
      tool_choice: { type: 'tool', name: 'create_garden_calendar' },
      messages: [{
        role: 'user',
        content: `You are an expert master gardener. Create a detailed month-by-month planting calendar. Only include months that have real tasks. Be specific to their frost dates and plant list.\n\n${context}`
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

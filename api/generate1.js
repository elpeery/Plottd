module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { context } = req.body;

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
          name: 'create_garden_core',
          description: 'Create the core garden plan including plants, soil, and calendar',
          input_schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              zone: { type: 'string' },
              climate: { type: 'string' },
              frostDates: {
                type: 'object',
                properties: { lastSpring: { type: 'string' }, firstFall: { type: 'string' } },
                required: ['lastSpring', 'firstFall']
              },
              metrics: {
                type: 'object',
                properties: {
                  estimatedCost: { type: 'string' },
                  weeklyHours: { type: 'string' },
                  harvestWindow: { type: 'string' },
                  totalPlants: { type: 'number' }
                },
                required: ['estimatedCost', 'weeklyHours', 'harvestWindow', 'totalPlants']
              },
              soilPlan: {
                type: 'object',
                properties: {
                  amendments: { type: 'array', items: { type: 'string' } },
                  compostNeeded: { type: 'string' },
                  ph: { type: 'string' },
                  notes: { type: 'string' }
                },
                required: ['amendments', 'compostNeeded', 'ph', 'notes']
              },
              plants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    variety: { type: 'string' },
                    qty: { type: 'string' },
                    startMethod: { type: 'string' },
                    startWeek: { type: 'string' },
                    transplantWeek: { type: 'string' },
                    daysToMaturity: { type: 'number' },
                    spacing: { type: 'string' },
                    depthToPlant: { type: 'string' },
                    waterNeeds: { type: 'string' },
                    sunNeeds: { type: 'string' },
                    companions: { type: 'array', items: { type: 'string' } },
                    avoid: { type: 'array', items: { type: 'string' } },
                    harvestMonths: { type: 'array', items: { type: 'number' } },
                    successionInterval: { type: 'string' },
                    notes: { type: 'string' },
                    affiliateSearch: { type: 'string' }
                  },
                  required: ['name', 'variety', 'qty', 'startMethod', 'daysToMaturity', 'spacing', 'harvestMonths', 'notes', 'affiliateSearch']
                }
              },
              successionPlan: { type: 'string' },
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
            required: ['summary', 'zone', 'climate', 'frostDates', 'metrics', 'soilPlan', 'plants', 'successionPlan', 'calendar']
          }
        }],
        tool_choice: { type: 'tool', name: 'create_garden_core' },
        messages: [{
          role: 'user',
          content: `You are an expert master gardener. Create a complete garden plan with 10-12 plants and a full month-by-month calendar. Include a diverse mix suited to their goals — vegetables, herbs, companion plants. Only include calendar months with real tasks. Be very specific to their region, zone, frost dates, soil, and goals. Include detailed cultivation notes for each plant.\n\n${context}`
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error });

    const toolUse = data.content.find(b => b.type === 'tool_use');
    if (!toolUse) return res.status(500).json({ error: { message: 'No tool response' } });

    return res.status(200).json(toolUse.input);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
};

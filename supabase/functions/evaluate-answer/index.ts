import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, answer, type, topic } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    
    if (type === 'behavioral') {
      systemPrompt = `You are an expert HR interviewer evaluating a candidate's answer to a behavioral interview question. 

Analyze the answer for:
1. **Clarity**: Is the answer clear and well-structured?
2. **Relevance**: Does it directly address the question?
3. **STAR Method**: Does it follow Situation, Task, Action, Result format?
4. **Impact**: Does it demonstrate measurable results or learning?
5. **Communication**: Is the tone professional and confident?

Provide:
- A score from 0-100
- 3-5 specific improvement suggestions
- What they did well
- What could be better

Format your response as constructive feedback that will help them improve.`;
    } else if (type === 'technical') {
      const topicMap: Record<string, string> = {
        'java': 'Java programming',
        'dbms': 'Database management',
        'os': 'Operating systems',
        'dsa': 'Data structures and algorithms',
      };
      
      const topicName = topicMap[topic as string] || 'technical';
      systemPrompt = `You are an expert technical interviewer evaluating a candidate's answer to a ${topicName} question.

Analyze the answer for:
1. **Technical Accuracy**: Is the answer technically correct?
2. **Completeness**: Does it cover all key aspects?
3. **Depth**: Does it show deep understanding beyond surface-level knowledge?
4. **Examples**: Does it include relevant examples or use cases?
5. **Explanation Quality**: Can they explain concepts clearly?

Provide:
- A score from 0-100
- 3-5 specific technical improvement suggestions
- What they got right
- What they missed or got wrong
- Additional concepts they should know

Format your response as constructive technical feedback.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Question: ${question}\n\nCandidate's Answer: ${answer}\n\nPlease evaluate this answer and provide a score (0-100) and detailed feedback.` 
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const feedbackText = data.choices[0].message.content;
    
    // Extract score from feedback (look for numbers between 0-100)
    const scoreMatch = feedbackText.match(/\b(\d{1,3})(?:\/100|\s*%|\s+out of 100)/i);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 75;

    return new Response(
      JSON.stringify({ 
        feedback: feedbackText,
        score: score
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in evaluate-answer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

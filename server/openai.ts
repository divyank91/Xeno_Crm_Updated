import OpenAI from "openai";
import type { SegmentRule } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "your-openai-api-key-here" 
});

export async function convertNaturalLanguageToRules(naturalLanguage: string): Promise<SegmentRule[]> {
  try {
    const prompt = `
You are an expert at converting natural language descriptions into structured customer segmentation rules.

Convert the following natural language description into a JSON array of segment rules:
"${naturalLanguage}"

Each rule should have this exact structure:
{
  "field": "one of: totalSpent, visitCount, lastVisit, status, location, emailVerified",
  "operator": "one of: gt, lt, eq, gte, lte",
  "value": "the value to compare against"
}

Field mappings:
- "spent", "spending", "purchase amount" → totalSpent
- "visits", "visit count", "times visited" → visitCount  
- "last visit", "last seen", "inactive", "days ago" → lastVisit
- "status", "tier", "vip", "premium" → status
- "location", "city", "region" → location
- "email verified", "verified email" → emailVerified

Operator mappings:
- "more than", "greater than", "above", "over" → gt
- "less than", "under", "below" → lt
- "equal to", "equals", "is" → eq
- "at least", "minimum" → gte
- "at most", "maximum" → lte

For date-related queries about "days ago" or "inactive", use lastVisit field with appropriate operator.
For status queries, common values are: "active", "inactive", "vip", "premium".

Return only a JSON array of rules, no other text.

Examples:
"Customers who spent over ₹10,000" → [{"field": "totalSpent", "operator": "gt", "value": "10000"}]
"Users who haven't visited in 30 days" → [{"field": "lastVisit", "operator": "lt", "value": "30"}]
"VIP customers with more than 5 visits" → [{"field": "status", "operator": "eq", "value": "vip"}, {"field": "visitCount", "operator": "gt", "value": "5"}]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at converting natural language into structured customer segmentation rules. Respond only with valid JSON arrays."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      // If direct parsing fails, try to extract array from the response
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        parsed = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error("Invalid JSON response from OpenAI");
      }
    }

    // Ensure we have an array
    const rules = Array.isArray(parsed) ? parsed : (parsed.rules || []);
    
    // Validate and clean up the rules
    const validatedRules: SegmentRule[] = rules
      .filter((rule: any) => rule.field && rule.operator && rule.value !== undefined)
      .map((rule: any) => ({
        field: rule.field,
        operator: rule.operator,
        value: rule.value.toString()
      }));

    return validatedRules;

  } catch (error) {
    console.error("OpenAI conversion error:", error);
    throw new Error(`Failed to convert natural language to rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateCampaignMessage(objective: string, audienceDescription: string): Promise<Array<{type: string, message: string, engagement: string}>> {
  try {
    const prompt = `
Generate 3 different campaign message suggestions for the following:

Objective: ${objective}
Audience: ${audienceDescription}

Create messages that are:
1. Personalized (use {{name}} placeholder)
2. Compelling and action-oriented
3. Appropriate for the target audience
4. Varied in approach (urgency, value, appreciation, etc.)

Return a JSON object with this structure:
{
  "messages": [
    {
      "type": "Message category (e.g., Win-back Campaign, Urgency-based, Value-focused, etc.)",
      "message": "The actual message text with {{name}} placeholder",
      "engagement": "Estimated engagement rate as percentage (e.g., 8.2%)"
    }
  ]
}

Make the messages professional, engaging, and suitable for SMS/email marketing.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert marketing copywriter who creates high-converting campaign messages. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const parsed = JSON.parse(content);
    const messages = parsed.messages || [];

    // Validate message structure
    const validatedMessages = messages
      .filter((msg: any) => msg.type && msg.message && msg.engagement)
      .map((msg: any) => ({
        type: msg.type,
        message: msg.message,
        engagement: msg.engagement
      }));

    return validatedMessages;

  } catch (error) {
    console.error("OpenAI message generation error:", error);
    throw new Error(`Failed to generate campaign messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateCampaignInsights(campaignData: {
  name: string;
  audienceSize: number;
  sentCount: number;
  failedCount: number;
  deliveryRate: number;
}): Promise<string> {
  try {
    const prompt = `
Analyze the following campaign performance data and generate a human-readable insight summary:

Campaign: ${campaignData.name}
Audience Size: ${campaignData.audienceSize} customers
Messages Sent: ${campaignData.sentCount}
Messages Failed: ${campaignData.failedCount}
Delivery Rate: ${campaignData.deliveryRate}%

Generate a concise, professional summary that highlights:
1. Overall campaign performance
2. Key metrics and their significance
3. Any notable patterns or insights
4. Brief recommendations for improvement

Keep the summary conversational and actionable, as if explaining to a marketing manager.

Return the response as a JSON object:
{
  "summary": "The insight summary text"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a marketing analytics expert who provides clear, actionable insights about campaign performance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const parsed = JSON.parse(content);
    return parsed.summary || "Campaign analysis completed successfully.";

  } catch (error) {
    console.error("OpenAI insights generation error:", error);
    throw new Error(`Failed to generate campaign insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

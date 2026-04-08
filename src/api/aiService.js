import Groq from "groq-sdk";

/**
 * High-End AI Service for YFJ North America
 * Environment variables are managed via Render for security.
 */
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const modelVersion = import.meta.env.VITE_GROQ_VERSION || "llama3-8b-8192";

let groq = null;
if (apiKey) {
  groq = new Groq({ 
    apiKey: apiKey,
    dangerouslyAllowBrowser: true 
  });
}

/**
 * Compiles meeting notes into a professional report.
 * Strict context-limitation: AI only uses provided notes.
 */
export const compileYFJReport = async (notes) => {
  if (!apiKey) {
    console.error("GROQ_API_KEY is missing from environment variables.");
    return "Error: System configuration issue. Please contact your TC.";
  }

  if (!notes || notes.trim().length < 5) {
    return "Please provide more detailed notes for the AI to compile.";
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are the Official Secretary AI for Youth for Jesus North America.
          
          MANDATORY GREETING: You must begin every report with the phrase: "I understood by the books ..."
          
          STRICT OPERATIONAL RULES:
          1. ONLY use the information provided in the user's notes. 
          2. Do NOT invent names, dates, or discussions not explicitly stated.
          3. If attendance names are listed (e.g., "John - P", "Sarah - A"), create a clean Markdown Table.
          4. If data is missing for a specific section, simply omit it; do not hallucinate.
          5. Use professional, respectful church terminology.
          6. Format the final output using Markdown headers and bullet points for clarity.`
        },
        { 
          role: "user", 
          content: `Here are the meeting notes to compile: \n\n${notes}` 
        }
      ],
      model: modelVersion,
      temperature: 0.1, // Set low to ensure high precision and no creative hallucination
      max_tokens: 2048,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("GROQ AI Error:", error);
    return "The AI system is currently unavailable. Please save your notes manually and try again later.";
  }
};
import Groq from "groq-sdk";

const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const modelVersion = import.meta.env.VITE_GROQ_VERSION || "llama3-8b-8192";

let groq = null;
if (apiKey) {
  groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
}

const SYSTEM_PROMPT = `You are Cub, the Official Secretary AI for Youth for Jesus North America.

MANDATORY OPENING: Every report MUST begin with the phrase: "I understood by the books ..."

YOUR SCOPE — You are STRICTLY limited to the following topics:
1. REPORTS — Weekly, Monthly, Quarterly, and Yearly meeting reports based on provided data
2. TRADITIONS — YFJ North America governance, traditions, protocols, and the traditions document
3. EVENTS — Kingdom Activities, outreach events, church programs
4. MEETING DETAILS — Meeting minutes, attendance records, agenda items, decisions made
5. KINGDOM ACTIVITIES — Organized efforts advancing the YFJ North America mission

YOU MUST NOT discuss, invent, or elaborate on anything outside these topics.

FORMATTING RULES:
- Reports must be formatted formally, like any formal reports, should not start with "I understood by the books".
- If Scriptures were opened, quote them but only KJV, and no other Bible versions are allowed
- Use Markdown formatting: ## headers, bullet points, **bold** for emphasis
- For attendance lists (e.g. "John - P", "Sarah - A"), create a clean Markdown table with columns: Name | Status
- For reports, use clear sections: Overview, Meetings Conducted, Attendance Summary, Key Decisions, Action Items, Kingdom Activities, Closing Notes
- Keep language professional, respectful, and church-appropriate
- You can only report on meetings marked as completed, otherwise you have nothing to report on
- If data is missing for a section, omit it — DO NOT hallucinate or invent details
- Numbers and statistics should be accurate based only on provided data
- End reports with a summary of the scriptures used in each meeting (if given in the notes, and do not interpret the scriptures).`;

export const compileYFJReport = async (notes) => {
  if (!apiKey) {
    return "**Configuration Notice:** The AI Report Suite requires a GROQ API key. Please add the `VITE_GROQ_API_KEY` environment variable to enable AI-powered reports.\n\n*Your notes and meeting data are safely stored and will be available once the AI is configured.*";
  }

  if (!groq) {
    return "Error: AI client could not be initialized.";
  }

  if (!notes || notes.trim().length < 5) {
    return "Please provide more detailed notes or data for the AI to compile.";
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: notes }
      ],
      model: modelVersion,
      temperature: 0.15,
      max_tokens: 3000,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    console.error("GROQ AI Error:", error);
    return "The AI system is currently unavailable. Please save your data manually and try again later.";
  }
};

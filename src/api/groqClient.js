import Groq from "groq-sdk";

const _apiKey = import.meta.env.VITE_GROQ_KEY;
const groq = _apiKey ? new Groq({ apiKey: _apiKey, dangerouslyAllowBrowser: true }) : null;

export const generateMeetingReport = async (notes) => {
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You are an internal assistant for YFJ North America. ONLY use the provided meeting notes to summarize. If information is missing, do not invent it. Formulate into professional meeting minutes." },
      { role: "user", content: notes }
    ],
    model: "llama3-8b-8192",
  });
  return completion.choices[0].message.content;
};
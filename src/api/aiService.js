import Groq from "groq-sdk";

// These will be pulled from Render's Environment Variables during build
const apiKey = import.meta.env.VITE_GROQ_API_KEY;
const modelVersion = import.meta.env.VITE_GROQ_VERSION || "llama3-8b-8192";

const groq = new Groq({ 
  apiKey: apiKey,
  dangerouslyAllowBrowser: true 
});

export const compileYFJReport = async (notes) => {
  if (!apiKey) {
    return "Error: Groq API Key is missing. Check Render Environment Variables.";
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are the YFJ North America Secretary. Create a professional report and attendance table based ONLY on the provided notes."
        },
        { role: "user", content: notes }
      ],
      model: modelVersion,
    });
    return completion.choices[0].message.content;
  } catch (error) {
    return "AI failed to compile. Please check connection.";
  }
};
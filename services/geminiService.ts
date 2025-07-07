
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface ReceiptDetails {
  title: string | null;
  amount: number | null;
  category: string | null;
  date: string | null;
  time: string | null;
  description: string | null;
  items: Array<{ name: string; price: number; quantity: number | null }>;
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractDetailsFromReceipt(
  base64Image: string
): Promise<ReceiptDetails | null> {
  const model = "gemini-2.5-flash-preview-04-17";
  
  const prompt = `
    You are an expert expense tracker. Analyze the provided receipt image and extract the following details:
    - title: Create a title by combining the merchant's name and a short summary. Format it as "Merchant Name - Summary" (e.g., "Walmart - Weekly Groceries", "Starbucks - Morning Coffee"). If no merchant name is found, just provide the summary.
    - amount: The total amount paid as a number, with decimals.
    - category: Choose the most appropriate category from this list: Groceries, Utilities, Transport, Entertainment, Healthcare, Dining, Shopping, Other. If the category is not on the list, return what you think it is.
    - date: The date of the transaction in YYYY-MM-DD format.
    - time: The time of the transaction in HH:MM format (24-hour). If not available, set to null.
    - description: Any other relevant miscellaneous information from the receipt, like store location or specific notes. If none, set to null.
    - items: A list of items purchased, each with a 'name' (string), 'price' (number), and 'quantity' (number, defaulting to 1 if not available). If no items are listed, provide an empty array.

    If you cannot determine a piece of information, set its value to null (except for items, which should be an empty array).
    Provide the output in a clean JSON format with no extra text or markdown fences. 
    
    The JSON object must have the following structure: 
    { 
      "title": string | null, 
      "amount": number | null, 
      "category": string | null, 
      "date": string | null, 
      "time": string | null,
      "description": string | null,
      "items": Array<{ "name": string, "price": number, "quantity": number | null }> 
    }
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64Image,
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
        }
    });

    let jsonStr = response.text.trim();

    // In case the model still wraps the JSON in markdown fences
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as ReceiptDetails;
    return parsedData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // This could be a network error or an error from the API itself
    if (error instanceof Error) {
        throw new Error(`Failed to parse receipt details: ${error.message}`);
    }
    throw new Error("An unknown error occurred while processing the receipt.");
  }
}
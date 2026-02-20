import { GoogleGenAI } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface DrugAnalysis {
  drugName: string;
  riskLevel: 'low' | 'medium' | 'high';
  interactions: string[];
  contraindications: string[];
  sideEffects: string[];
  warnings: string[];
  summary: string;
}

export interface DrugInteractionAnalysis {
  drug1: string;
  drug2: string;
  interactionLevel: 'none' | 'minor' | 'moderate' | 'major';
  description: string;
  recommendations: string[];
}

export async function analyzeDrugInformation(drugName: string, drugDetails: any): Promise<DrugAnalysis> {
  try {
    const prompt = `Analyze the following medication for safety, interactions, and clinical considerations:

Drug Name: ${drugName}
Generic Name: ${drugDetails.genericName || 'Not specified'}
Category: ${drugDetails.category || 'Not specified'}
Manufacturer: ${drugDetails.manufacturer || 'Not specified'}
Uses: ${drugDetails.uses?.join(', ') || 'Not specified'}

Please provide a comprehensive analysis including:
1. Risk level assessment (low/medium/high)
2. Key drug interactions to watch for
3. Important contraindications
4. Common side effects
5. Critical warnings
6. Clinical summary

Respond with JSON in this exact format:
{
  "drugName": "${drugName}",
  "riskLevel": "low|medium|high",
  "interactions": ["interaction1", "interaction2"],
  "contraindications": ["contraindication1", "contraindication2"],
  "sideEffects": ["sideEffect1", "sideEffect2"],
  "warnings": ["warning1", "warning2"],
  "summary": "comprehensive clinical summary"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            drugName: { type: "string" },
            riskLevel: { type: "string", enum: ["low", "medium", "high"] },
            interactions: { 
              type: "array", 
              items: { type: "string" }
            },
            contraindications: { 
              type: "array", 
              items: { type: "string" }
            },
            sideEffects: { 
              type: "array", 
              items: { type: "string" }
            },
            warnings: { 
              type: "array", 
              items: { type: "string" }
            },
            summary: { type: "string" }
          },
          required: ["drugName", "riskLevel", "interactions", "contraindications", "sideEffects", "warnings", "summary"]
        }
      },
      contents: prompt
    });

    const analysisText = response.text;
    if (analysisText) {
      return JSON.parse(analysisText);
    }
    
    throw new Error("Empty response from Gemini");
  } catch (error) {
    console.error('Gemini analysis error:', error);
    
    // Fallback analysis
    return {
      drugName: drugName,
      riskLevel: 'medium',
      interactions: ['Consult healthcare provider for drug interactions'],
      contraindications: ['Known hypersensitivity', 'Consult physician'],
      sideEffects: ['Mild to moderate side effects possible', 'Monitor for adverse reactions'],
      warnings: ['Use as directed', 'Do not exceed recommended dose'],
      summary: `${drugName} is an NMRA-registered medication. Please consult healthcare providers for complete prescribing information and safety considerations.`
    };
  }
}

export async function analyzeMultipleDrugInteractions(drugs: string[]): Promise<DrugInteractionAnalysis[]> {
  if (drugs.length < 2) return [];

  try {
    const prompt = `Analyze potential drug interactions between these medications:
${drugs.map((drug, i) => `${i + 1}. ${drug}`).join('\n')}

For each pair of drugs, provide interaction analysis including:
1. Interaction level (none/minor/moderate/major)
2. Description of the interaction
3. Clinical recommendations

Respond with JSON array in this format:
[
  {
    "drug1": "Drug A",
    "drug2": "Drug B", 
    "interactionLevel": "none|minor|moderate|major",
    "description": "detailed interaction description",
    "recommendations": ["recommendation1", "recommendation2"]
  }
]`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              drug1: { type: "string" },
              drug2: { type: "string" },
              interactionLevel: { type: "string", enum: ["none", "minor", "moderate", "major"] },
              description: { type: "string" },
              recommendations: { 
                type: "array", 
                items: { type: "string" }
              }
            },
            required: ["drug1", "drug2", "interactionLevel", "description", "recommendations"]
          }
        }
      },
      contents: prompt
    });

    const analysisText = response.text;
    if (analysisText) {
      return JSON.parse(analysisText);
    }

    return [];
  } catch (error) {
    console.error('Drug interaction analysis error:', error);
    return [];
  }
}

export async function generateDrugReport(drugName: string, patientInfo?: any): Promise<string> {
  try {
    const prompt = `Generate a comprehensive medication report for: ${drugName}

Patient Information: ${patientInfo ? JSON.stringify(patientInfo) : 'Not provided'}

Include:
1. Drug overview and classification
2. Mechanism of action
3. Indications and contraindications
4. Dosing guidelines
5. Safety profile
6. Monitoring requirements
7. Patient counseling points

Provide a detailed clinical report suitable for healthcare professionals.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt
    });

    return response.text || `Comprehensive report for ${drugName} - Please consult healthcare provider for complete information.`;
  } catch (error) {
    console.error('Report generation error:', error);
    return `Report for ${drugName} - Please consult healthcare provider for complete medication information.`;
  }
}

// Extract medication names from free text (OCR output) using Gemini LLM
export async function extractMedicationNamesFromText(text: string): Promise<string[]> {
  try {
    const prompt = `Extract a JSON array of medication names mentioned in the following prescription text. Return only an array of strings with the medication names, no extra commentary.\n\nPrescription text:\n${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      contents: prompt
    });

    const txt = response.text;
    if (txt) {
      return JSON.parse(txt);
    }
    return [];
  } catch (error) {
    console.error('Failed to extract medication names:', error);
    return [];
  }
}
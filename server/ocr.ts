import fetch from 'node-fetch';

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate';

export async function extractTextFromBase64(imageBase64: string): Promise<string> {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_VISION_API_KEY not set — falling back to mock OCR output for local testing');
    // Return a simple mocked OCR text so end-to-end flows can be tested without Vision key
    return 'Lisinopril 10mg once daily\nMetformin 500mg twice daily';
  }

  const body = {
    requests: [
      {
        image: { content: imageBase64 },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }]
      }
    ]
  };

  const res = await fetch(`${VISION_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Vision API error: ${res.status} ${txt}`);
  }

  const data = await res.json();
  const annotations = data?.responses?.[0];
  const text = annotations?.fullTextAnnotation?.text || annotations?.textAnnotations?.[0]?.description || '';
  return text;
}

export default extractTextFromBase64;

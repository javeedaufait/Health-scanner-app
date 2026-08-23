import { EvaluationReason, AllergenWarning } from '@health-scanner/shared';
import { config } from '../../config';

export interface ExplanationInput {
  productName: string;
  status: 'GOOD_CHOICE' | 'USE_CAUTION' | 'NOT_A_GOOD_CHOICE';
  reasons: EvaluationReason[];
  allergenWarnings: AllergenWarning[];
}

export class ExplanationService {
  async generateFriendlyExplanation(input: ExplanationInput, language: 'en' | 'ml' = 'en'): Promise<string> {
    if (config.geminiApiKey || config.openAiApiKey) {
      try {
        return await this.generateWithLlm(input, language);
      } catch (err) {
        console.warn('AI explanation generation failed, using rule-engine fallback summary', err);
      }
    }

    return this.generateTemplateFallback(input, language);
  }

  private async generateWithLlm(input: ExplanationInput, language: 'en' | 'ml'): Promise<string> {
    const reasonsText = input.reasons.map((r) => `- ${r.messageEn} (Advice: ${r.betterChoiceAdviceEn || 'N/A'})`).join('\n');
    const allergensText = input.allergenWarnings.map((a) => `- Allergen warning: ${a.messageEn}`).join('\n');

    const prompt = `You are a friendly, caring nutrition assistant explaining packaged food suitability for an everyday supermarket shopper in Kerala.
CRITICAL SAFETY CONSTRAINTS:
1. You are NOT a doctor and must NOT diagnose diseases or prescribe anything.
2. You must NOT create any new health conclusions or thresholds that are not provided in the rule results below.
3. Only summarize the provided reasons in 1 to 2 warm, simple, encouraging sentences.
4. Language requested: ${language === 'ml' ? 'Malayalam (മലയാളം)' : 'English'}.

Product: ${input.productName}
Assessment: ${input.status}
Verified Rule Reasons:
${reasonsText || 'No specific health concerns found.'}
${allergensText ? `Allergens Detected:\n${allergensText}` : ''}`;

    if (config.geminiApiKey) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.geminiApiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json() as any;
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || this.generateTemplateFallback(input, language);
    }

    if (config.openAiApiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.openAiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        }),
      });
      const data = await res.json() as any;
      return data.choices?.[0]?.message?.content?.trim() || this.generateTemplateFallback(input, language);
    }

    return this.generateTemplateFallback(input, language);
  }

  private generateTemplateFallback(input: ExplanationInput, language: 'en' | 'ml'): string {
    if (language === 'ml') {
      if (input.allergenWarnings.length > 0) {
        return `നിങ്ങൾ ഒഴിവാക്കാൻ തിരഞ്ഞെടുത്ത ചേരുവകൾ ${input.productName}-ൽ അടങ്ങിയിരിക്കുന്നു. പാക്കറ്റിലെ ലേബൽ ദയവായി പരിശോധിക്കുക.`;
      }
      if (input.status === 'NOT_A_GOOD_CHOICE') {
        return `${input.productName} നിങ്ങളുടെ ആരോഗ്യ ലക്ഷ്യങ്ങൾക്ക് ഏറ്റവും അനുയോജ്യമായേക്കില്ല. കുറഞ്ഞ പഞ്ചസാരയും ഉപ്പുമുള്ള ഇനങ്ങൾ തിരഞ്ഞെടുക്കുക.`;
      }
      if (input.status === 'USE_CAUTION') {
        return `${input.productName}-ൽ ചില ചേരുവകൾ ശ്രദ്ധിച്ചു മാത്രം കഴിക്കേണ്ടവയാണ്. അളവ് നിയന്ത്രിച്ചു ഉപയോഗിക്കുക.`;
      }
      return `${input.productName} നിങ്ങളുടെ ആരോഗ്യ പ്രൊഫൈലിന് അനുയോജ്യമായ നല്ലൊരു തിരഞ്ഞെടുപ്പാണ്.`;
    }

    if (input.allergenWarnings.length > 0) {
      return `${input.productName} contains ingredients matching your dietary restrictions. Please verify the physical package label.`;
    }
    if (input.status === 'NOT_A_GOOD_CHOICE') {
      return `${input.productName} may not be the best everyday choice for your health profile. Consider lower sugar or lower sodium alternatives.`;
    }
    if (input.status === 'USE_CAUTION') {
      return `${input.productName} contains nutrients you may want to enjoy in moderation based on your health goals.`;
    }
    return `${input.productName} fits well within your health and dietary preferences.`;
  }
}

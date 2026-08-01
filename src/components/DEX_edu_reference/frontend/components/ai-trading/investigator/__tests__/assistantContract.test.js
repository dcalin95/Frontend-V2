import { buildAssistantPrompt, parseAssistantExplanation } from '../assistantContract';

const investigation = {
  subject: { kind: 'address', normalized: '0x1111111111111111111111111111111111111111', chainId: 56 },
  coverage: { status: 'partial' },
  notes: [{ content: 'private investigator note' }],
  result: {
    evidence: [{ id: 'evidence-1', transactionHash: `0x${'a'.repeat(64)}` }],
    findings: [{ id: 'finding-1', severity: 'High', supportingEvidence: ['evidence-1'] }],
  },
};

describe('Investigator assistant contract', () => {
  test('minimizes context and treats provider text as untrusted data', () => {
    const prompt = buildAssistantPrompt(investigation, 'Explain the evidence');
    expect(prompt).toContain('UNTRUSTED_CONTEXT');
    expect(prompt).toContain('evidence-1');
    expect(prompt).not.toContain('private investigator note');
  });

  test('accepts a schema-valid response with real case citations', () => {
    const response = parseAssistantExplanation(JSON.stringify({
      answer: 'The observed transfer needs review.',
      evidenceIds: ['evidence-1'],
      findingIds: ['finding-1'],
      limitations: ['Coverage is partial.'],
      suggestedNextSteps: ['Collect the next bounded page.'],
      unsupportedClaims: [],
    }), investigation);
    expect(response.evidenceIds).toEqual(['evidence-1']);
  });

  test('rejects fabricated citations and unstructured output', () => {
    expect(() => parseAssistantExplanation('plain text', investigation)).toThrow('invalid structured response');
    expect(() => parseAssistantExplanation(JSON.stringify({
      answer: 'Unsupported', evidenceIds: ['invented'], findingIds: [], limitations: [], suggestedNextSteps: [], unsupportedClaims: [],
    }), investigation)).toThrow('not in this case');
  });
});

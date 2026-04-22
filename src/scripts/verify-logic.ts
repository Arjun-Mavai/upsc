
import { cleanHtml, introBeforeFirstStatement, extIntroEmbedsStatementLabels } from './src/features/tests/components/UPSCQuestionRenderer';

// Mocking the parseUPSCContent logic to verify markers
function parseUPSCContent(rawText: string) {
    if (!rawText) return { context: '', items: [], questionLine: '' };
    let text = rawText.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<\/div>/gi, '\n').replace(/<\/?[^>]+(>|$)/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    text = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();

    const items: any[] = [];
    const mainContent = text;
    let context = text;
    
    // Alpha markers a), b), c)
    const alphaSplitPattern = /\s+[\(]?([a-e])[\)\.]\s+(?=[A-Z\u0900-\u097F])/gi;
    const alphaMatches = [...mainContent.matchAll(alphaSplitPattern)];
    
    if (alphaMatches.length >= 2) {
        context = mainContent.substring(0, alphaMatches[0].index ?? 0).trim();
        for (let i = 0; i < alphaMatches.length; i++) {
            const match = alphaMatches[i];
            const startIdx = (match.index ?? 0) + match[0].length;
            const endIdx = i < alphaMatches.length - 1 ? (alphaMatches[i+1].index ?? mainContent.length) : mainContent.length;
            items.push({ marker: match[1], text: mainContent.substring(startIdx, endIdx).trim() });
        }
    }
    
    return { context, items };
}

async function test() {
    console.log('Testing Parser Improvements...');
    
    const sample1 = "Consider the following: a) Item One b) Item Two c) Item Three";
    const p1 = parseUPSCContent(sample1);
    console.log('Sample 1 (Alpha):', p1.items.length === 3 ? 'SUCCESS' : 'FAILED', p1.items.map(i => i.marker));

    const sample2 = "Which of the following are correct? (i) First statement (ii) Second statement";
    // Need to test the lowerRoman logic I added
    console.log('Testing Lower Roman Logic...');
    // ... (logic from component)
    const lowerRomanPattern = /\s+[\(]?(i{1,3}|iv|v)[\)\.]\s+(?=[A-Z\u0900-\u097F])/gi;
    const lowerRomanMatches = [...sample2.matchAll(lowerRomanPattern)];
    console.log('Sample 2 (Lower Roman):', lowerRomanMatches.length === 2 ? 'SUCCESS' : 'FAILED');

    console.log('\nTesting Duplication Fix Logic...');
    const extIntro = "What are the duties of CDS?";
    const stem = "What are the duties of CDS? Statement-I: Duty 1 Statement-II: Duty 2";
    const intro = introBeforeFirstStatement(stem);
    console.log('Intro Cut:', intro === "What are the duties of CDS?" ? 'SUCCESS' : 'FAILED', `[${intro}]`);
    
    const doubleIntro = "Statement I: Duty 1 Statement II: Duty 2";
    const doubled = extIntroEmbedsStatementLabels(doubleIntro);
    console.log('Embeds labels:', doubled ? 'SUCCESS' : 'FAILED');
}

test();

import { buildCombinedMainsPromptForExternalAi } from './src/config/mains-topic-ai-prompt';
import { getMainsPaperExpertAddon } from './src/config/mains-paper-expert-addons';

const p = buildCombinedMainsPromptForExternalAi({
  paperNumber: 1,
  paperTitleEn: 'General Studies I',
  unitTitleHi: 'भारतीय विरासत और संस्कृति',
  unitTitleEn: 'Indian Heritage and Culture',
  topicTitleHi: 'प्राचीन काल से आधुनिक काल तक कला के रूप, साहित्य और वास्तुकला',
  topicTitleEn: 'Art forms, literature and architecture from ancient to modern times',
  unitPart: 'NONE',
  paperPartAddon: getMainsPaperExpertAddon(1),
  noImportedQuestions: true,
  pyqReferenceBlock: ''
});

console.log(p);

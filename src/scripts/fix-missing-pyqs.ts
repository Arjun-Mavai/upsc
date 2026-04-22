import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function main() {
  const { db } = await import('../db/index');
  const { questions } = await import('../db/schema');
  const { eq } = await import('drizzle-orm');

  const updates = [
    // --- UPSC 2024 ---
    {
      id: '2kyRFsVPSS9bqKtj3N5s_', // Q51 (Atmosphere)
      questionTextEn: 'Consider the following statements:',
      extUpdates: {
        layoutType: 'assertion_reason',
        statementI: 'वायुमंडल आने वाले सौर विकिरण (incoming solar radiation) की तुलना में पार्थिव विकिरण (terrestrial radiation) से अधिक गर्म होता है।',
        statementIEn: 'The atmosphere is heated more by incoming solar radiation than by terrestrial radiation.',
        statementII: 'वायुमंडल में कार्बन डाइऑक्साइड और अन्य ग्रीनहाउस गैसें लंबी तरंग के विकिरण (long-wave radiation) की अच्छी अवशोषक (absorbers) हैं।',
        statementIIEn: 'Carbon dioxide and other greenhouse gases in the atmosphere are good absorbers of long-wave radiation.',
        questionPrompt: 'उपर्युक्त कथनों के संदर्भ में निम्नलिखित में से कौन-सा सही है?',
        questionPromptEn: 'Which one of the following is correct in respect of the above statements?'
      }
    },
    {
      id: 'xGIvAOnRoRPLp1bNVz4WH', // Q52 (Troposphere)
      questionTextEn: 'Consider the following statements:',
      extUpdates: {
        layoutType: 'assertion_reason',
        statementI: 'छोभमंडल की मोटाई ध्रुवों की तुलना में भूमध्य रेखा पर बहुत अधिक है।',
        statementIEn: 'Thickness of the troposphere at the equator is much greater as compared to poles.',
        statementII: 'भूमध्य रेखा पर, तीव्र संवहनी धाराओं द्वारा ऊष्मा को अधिक ऊँचाई तक पहुँचाया जाता है।',
        statementIIEn: 'At the equator, heat is transported to great heights by strong convectional currents.',
        questionPrompt: 'उपर्युक्त कथनों के संदर्भ में निम्नलिखित में से कौन-सा सही है?',
        questionPromptEn: 'Which one of the following is correct in respect of the above statements?'
      }
    },
    {
      id: 'PGvu1Ror2lspOCwROUZSw', // Q91 (Sahel)
      questionTextEn: 'Consider the following statements:',
      extUpdates: {
        layoutType: 'assertion_reason',
        statementI: 'साहेल (Sahel) क्षेत्र में अस्थिरता और बिगड़ती सुरक्षा स्थिति है।',
        statementIEn: 'There is instability and worsening security situation in the Sahel region.',
        statementII: 'हाल के दिनों में साहेल क्षेत्र के कई देशों में सैन्य तख्तापलट (military takeovers/coups d’état) हुए हैं।',
        statementIIEn: 'There have been military takeovers/coups d’état in several countries of the Sahel region in the recent past.',
        questionPrompt: 'उपर्युक्त कथनों के संदर्भ में निम्नलिखित में से कौन-सा सही है?',
        questionPromptEn: 'Which one of the following is correct in respect of the above statements?'
      }
    },
    {
      id: '3UIspoGoaj08qrYdpdrtb', // Q20 (Net-Zero Industry Act)
      questionTextEn: 'Consider the following statements:',
      extUpdates: {
        layoutType: 'assertion_reason',
        statementI: 'यूरोपीय संसद ने हाल ही में नेट-जीरो इंडस्ट्री एक्ट (Net-Zero Industry Act) को मंजूरी दी है।',
        statementIEn: 'The European Parliament approved the Net-Zero Industry Act recently.',
        statementII: 'यूरोपीय संघ का इरादा 2040 तक कार्बन तटस्थता हासिल करने का है और इसलिए उसका लक्ष्य उस समय तक अपनी सभी स्वच्छ तकनीक विकसित करना है।',
        statementIIEn: 'The European Union intends to achieve carbon neutrality by 2040 and therefore aims to develop all of its own clean technology by that time.',
        questionPrompt: 'उपर्युक्त कथनों के संदर्भ में निम्नलिखित में से कौन-सा सही है?',
        questionPromptEn: 'Which one of the following is correct in respect of the above statements?'
      }
    },
    {
      id: '5fIkivYCZlU5cpNR7dCBe', // Q22 (Indian Flying Fox)
      questionTextEn: 'Consider the following statements:',
      extUpdates: {
        layoutType: 'assertion_reason',
        statementI: 'इंडियन फ्लाइंग फॉक्स (Indian Flying Fox) को वन्यजीव (संरक्षण) अधिनियम, 1972 में "वर्मिन" (vermin) श्रेणी के तहत रखा गया है।',
        statementIEn: 'The Indian Flying Fox is placed under the "vermin" category in the Wild Life (Protection) Act, 1972.',
        statementII: 'इंडियन फ्लाइंग फॉक्स अन्य जानवरों के खून पर फ़ीड करती है।',
        statementIIEn: 'The Indian Flying Fox feeds on the blood of other animals.',
        questionPrompt: 'उपर्युक्त कथनों के संदर्भ में निम्नलिखित में से कौन-सा सही है?',
        questionPromptEn: 'Which one of the following is correct in respect of the above statements?'
      }
    },
    // --- UPSC 2022 ---
    {
      id: '0-EuSbTRDhTOv912z8Tws', // Q36 (Comm Tech - CCTV/RFID/WLAN)
      questionTextEn: 'Consider the following communication technologies:',
      extUpdates: {
        layoutType: 'statements',
        listItems: [
          { id: '1', text: 'क्लोज्ड-सर्किट टेलीविजन (CCTV)', textEn: 'Closed-circuit Television' },
          { id: '2', text: 'रेडियो फ्रीक्वेंसी आइडेंटिफिकेशन (RFID)', textEn: 'Radio Frequency Identification' },
          { id: '3', text: 'वायरलेस लोकल एरिया नेटवर्क (WLAN)', textEn: 'Wireless Local Area Network' }
        ],
        questionPrompt: 'उपर्युक्त में से किसे/किन्हें "शॉर्ट-रेंज" (short-range) डिवाइस/टेक्नोलॉजी माना जाता है?',
        questionPromptEn: 'Which of the above are considered "short-range" devices/technologies?'
      }
    },
    {
      id: '2k7Abg5F4QhWvD26iyal8', // Q54 (Tea Board)
      questionTextEn: 'With reference to the "Tea Board" in India, consider the following statements:',
      extUpdates: {
        layoutType: 'statements',
        listItems: [
          { id: '1', text: 'चाय बोर्ड एक सांविधिक निकाय (Statutory body) है।', textEn: 'The Tea Board is a statutory body.' },
          { id: '2', text: 'यह कृषि और किसान कल्याण मंत्रालय के अधीन एक नियामक निकाय है।', textEn: 'It is a regulatory body attached to the Ministry of Agriculture and Farmers Welfare.' },
          { id: '3', text: 'चाय बोर्ड का मुख्यालय कोलकाता में स्थित है।', textEn: 'The Tea Board\'s head office is situated in Kolkata.' },
          { id: '4', text: 'बोर्ड के दुबई और मास्को में विदेशी कार्यालय हैं।', textEn: 'The Board has overseas offices at Dubai and Moscow.' }
        ],
        questionPrompt: 'उपर्युक्त कथनों में से कौन-से सही हैं?',
        questionPromptEn: 'Which of the statements given above are correct?'
      }
    },
    {
      id: '1NjvuAoyvS_FNwytqP9H1', // Q67 (Climate Group / EP100)
      questionTextEn: 'Consider the following statements:',
      extUpdates: {
        layoutType: 'statements',
        listItems: [
          { id: '1', text: 'क्लाइमेट ग्रुप (The Climate Group) एक अंतरराष्ट्रीय गैर-लाभकारी संगठन है...', textEn: 'The Climate Group is an international non-profit organization...' },
          { id: '2', text: 'इंटरनेशनल एनर्जी एजेंसी (IEA) ने क्लाइमेट ग्रुप की साझेदारी में \'EP100\' लॉन्च किया।', textEn: 'The International Energy Agency in partnership with the Climate Group launched a global initiative \'EP100\'.' },
          { id: '3', text: 'EP100 अग्रणी कंपनियों को एक साथ लाता है जो ऊर्जा दक्षता में नवाचार को गति देने के लिए प्रतिबद्ध हैं।', textEn: 'EP100 brings together leading companies committed to driving innovation in energy efficiency...' },
          { id: '4', text: 'कुछ भारतीय कंपनियां \'EP100\' की सदस्य हैं।', textEn: 'Some Indian companies are members of \'EP100\'.' },
          { id: '5', text: 'इंटरनेशनल एनर्जी एजेंसी \'अंडर2 कोएलिशन\' (Under2 Coalition) के लिए सचिवालय है।', textEn: 'The International Energy Agency is the Secretariat to the \'Under2 Coalition\'.' }
        ],
        questionPrompt: 'उपर्युक्त कथनों में से कौन-से सही हैं?',
        questionPromptEn: 'Which of the statements given above are correct?'
      }
    }
  ];

  console.log('Starting PYQ data restoration...');
  
  for (const update of updates) {
    const q = await db.select().from(questions).where(eq(questions.id, update.id)).then(res => res[0]);
    if (q) {
      const existingExt = typeof q.extendedData === 'string' ? JSON.parse(q.extendedData) : (q.extendedData || {});
      const newExt = { ...existingExt, ...update.extUpdates };
      
      await db.update(questions)
        .set({ 
            extendedData: JSON.stringify(newExt),
            questionTextEn: update.questionTextEn 
        })
        .where(eq(questions.id, update.id));
        
      console.log(`Updated ID ${update.id} (Q#${q.order})`);
    } else {
      console.log(`ID ${update.id} not found in database.`);
    }
  }
  
  console.log('Restoration complete.');
}

main().catch(console.error);

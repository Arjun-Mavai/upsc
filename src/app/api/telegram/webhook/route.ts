import { NextResponse } from 'next/server';
import { saveIncomingMessage, saveOutgoingMessage } from '@/actions/support-inbox-actions';
import { sendHumanRequestTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const BOT_TOKEN = process.env.TELEGRAM_CONVERSATION_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not found');
      return new NextResponse('OK', { status: 200 }); // Return 200 so Telegram stops retrying
    }

    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    let chatId = null;
    let responseText = '';
    let inlineKeyboard = null;
    
    // For DB tracking
    let incomingText = '';
    let guestName = 'Telegram User';
    let callbackData = null;
    let isCommandOrText = false;

    // 1. Extract Info First
    if (body.message && body.message.text) {
      chatId = body.message.chat.id;
      incomingText = body.message.text;
      isCommandOrText = true;
      if (body.message.from && body.message.from.first_name) {
        guestName = body.message.from.first_name + (body.message.from.last_name ? ' ' + body.message.from.last_name : '');
      }
    } else if (body.callback_query) {
      chatId = body.callback_query.message.chat.id;
      callbackData = body.callback_query.data;
      incomingText = `[Button Clicked: ${callbackData}]`;
      if (body.callback_query.from && body.callback_query.from.first_name) {
        guestName = body.callback_query.from.first_name;
      }
    }

    if (!chatId || !incomingText) {
      return new NextResponse('OK', { status: 200 });
    }

    // 2. DB: Save Incoming Message
    let convId = null;
    let humanActive = false;
    const res = await saveIncomingMessage({
      platform: 'telegram',
      guestPhone: chatId.toString(), // Using chatId as phone equivalent
      guestName: guestName,
      text: incomingText,
    });
    convId = res.conversationId;
    humanActive = !!res.humanActive;

    // 3. Bot Suppression (if Human is Active)
    if (humanActive && !callbackData?.startsWith('FDBK_')) {
      return new NextResponse('OK', { status: 200 }); // Skip bot processing entirely
    }

    // 4. Generate Bot Response
    if (isCommandOrText) {
      const textContent = incomingText.trim().toLowerCase();
      
      const isGreeting = ['hi', 'hello', 'hey', 'namaste', 'start', '/start', '/help', 'menu', 'main menu'].includes(textContent);
      const isSupportRequest = textContent.includes('talk to support') || textContent.includes('help');

      if (isSupportRequest) {
        responseText = `🔧 *Support Desk / सपोर्ट डेस्क*\n\nPlease select your language to continue / अपनी भाषा चुनें 👇`;
        inlineKeyboard = {
          inline_keyboard: [
            [
              { text: 'English', callback_data: 'SUPPORT_EN' },
              { text: 'हिंदी', callback_data: 'SUPPORT_HI' }
            ]
          ]
        };
      } else if (isGreeting) {
        responseText = `🎉 *Welcome to UPSC ZenScroll*\n\n` +
          `UPSC Mains की तैयारी में सबसे बड़ी चुनौती सामग्री (Content) की कमी नहीं होती।\n\n` +
          `चुनौती होती है:\n` +
          `📌 क्या पढ़ना है\n` +
          `📌 कितना पढ़ना है\n` +
          `📌 और परीक्षा वास्तव में क्या पूछ रही है\n\n` +
          `ZenScroll का उद्देश्य केवल सामग्री देना नहीं,\n` +
          `बल्कि सिलेबस, PYQs और उत्तर लेखन के बीच संबंध को स्पष्ट करना है।\n` +
          `ताकि तैयारी अधिक व्यवस्थित, स्पष्ट और उद्देश्यपूर्ण बन सके।\n\n` +
          `🌐 Please select your language\n` +
          `🌐 कृपया अपनी भाषा चुनें:`;
        inlineKeyboard = {
          inline_keyboard: [
            [
              { text: 'English 🇬🇧', callback_data: 'LANG_EN' },
              { text: 'हिंदी 🇮🇳', callback_data: 'LANG_HI' }
            ]
          ]
        };
      } else if (textContent === '/mains' || textContent === 'mains') {
        responseText = `🔥 *Mains Gyankosh (UPSC):*\n\nHumara focus notes ya PDFs ke dump par bilkul nahi hai! Hum aapko UPSC Mains Syllabus ke har ek keyword ka deep structural analysis aur uske PYQs ka exact mapping dete hain.\n\nExplore here: 🔗 https://upsc.zenscroll.app/mains`;
        inlineKeyboard = {
          inline_keyboard: [[{ text: 'Chat with Human', callback_data: 'SUPPORT_EN' }]]
        };
      } else if (textContent === '/syllabus' || textContent === 'syllabus') {
        responseText = `📚 *UPSC Syllabus Hub:*\n\nSyllabus aur PYQ ki understanding UPSC clear karne ki sabse badi seedhi hai. Yahan aapko proper topic-wise breakup aur questions ka integration milega, koi random notes nahi.\n\nStart your journey: 🔗 https://upsc.zenscroll.app/syllabus`;
        inlineKeyboard = {
          inline_keyboard: [[{ text: 'Chat with Human', callback_data: 'SUPPORT_EN' }]]
        };
      } else if (textContent === '/prelims' || textContent === 'prelims') {
        responseText = `🎯 *Prelims Intelligence:*\nSystematically organized (Year-wise, Unit-wise) PYQ analytics and retention mnemonics. No rote learning.`;
        inlineKeyboard = {
          inline_keyboard: [[{ text: 'Chat with Human', callback_data: 'SUPPORT_EN' }]]
        };
      } else {
        // 1. Gratitude (Thanks)
        if (['thanks', 'thank you', 'tq', 'ty', 'dhanyawad', 'dhanyabad', 'shukriya'].some(word => textContent.includes(word))) {
          responseText = `You're most welcome! 😊 We're always here to help. Let us know if you need anything else.\n(आपका बहुत-बहुत स्वागत है! अगर आपको कुछ और मदद चाहिए तो हमें बताएं।)`;
        }
        // 2. Acknowledgement (Ok, Okay, Haan)
        else if (/^(ok|okay|k|thik|theek|haan|yes|yep|sure|achha)$/.test(textContent)) {
          responseText = `Great! 👍 Keep your motivation high. If you need the menu again, just send a 'Hi'. Happy studying!`;
        }
        // 3. Pricing & Plans
        else if (['price', 'pricing', 'fees', 'cost', 'kitne ka', 'plan'].some(word => textContent.includes(word))) {
          responseText = `Pricing details & Plans are available here! 🌐\n\n🔗 https://upsc.zenscroll.app/pricing\n\nIf you need help choosing a plan, just let us know! 👇`;
          inlineKeyboard = {
            inline_keyboard: [
              [{ text: '🔧 Support Desk', callback_data: 'SUPPORT_EN' }],
              [{ text: '🔙 Main Menu', callback_data: 'LANG_EN' }]
            ]
          };
        }
        // 4. App Download Queries
        else if (['app', 'download', 'play store', 'apk'].some(word => textContent.includes(word))) {
          responseText = `📱 *How to Install UPSC ZenScroll App*\n\n` +
            `Our platform is a fast, seamless Web-App. You don't need the Play Store! Just follow these easy steps:\n\n` +
            `🤖 *For Android Users (Chrome):*\n` +
            `1️⃣ Open 🔗 https://upsc.zenscroll.app\n` +
            `2️⃣ Click the **Three Dots (⋮)** in the top right corner.\n` +
            `3️⃣ Tap on **"Add to Home screen"**.\n` +
            `4️⃣ Click **"Add"** again. Done! 🎉\n\n` +
            `🍎 *For iPhone Users (Safari):*\n` +
            `1️⃣ Open 🔗 https://upsc.zenscroll.app\n` +
            `2️⃣ Tap the **Share icon** (square with an up arrow) at the bottom.\n` +
            `3️⃣ Scroll down and tap **"Add to Home Screen"** ➕.\n` +
            `4️⃣ Tap **"Add"** in the top right. Done! 🎉\n\n` +
            `Now you can use ZenScroll exactly like a native app! 🚀`;
        }
        // 5. Free / Demo Queries
        else if (['demo', 'free', 'trial'].some(word => textContent.includes(word))) {
          responseText = `We have plenty of Free Resources! 🎁\n\nYou can explore our Syllabus Library, attempt Free Tests, and read our Strategy Blogs without any payment.\n\nLet me show you the menu 👇`;
          inlineKeyboard = {
            inline_keyboard: [
              [{ text: 'English Menu', callback_data: 'LANG_EN' }],
              [{ text: 'हिंदी मेनू', callback_data: 'LANG_HI' }]
            ]
          };
        }
        // 6. Call Requests
        else if (['call', 'number', 'phone', 'baat karni', 'contact'].some(word => textContent.includes(word))) {
          responseText = `Right now, we provide fast and reliable support via Chat! 💬\n\nPlease share your exact query here, and I'll personally look into it to assist you.`;
        }
        // 7. Greetings (Morning/Night)
        else if (textContent.includes('morning') || textContent.includes('night') || textContent.includes('evening') || textContent.includes('afternoon')) {
          responseText = `Greetings! ☀️ Every day is a new opportunity for your UPSC prep. How can we assist you today? Send 'Hi' to open the menu.`;
        }
        // 8. Compliments
        else if (['awesome', 'great', 'nice', 'good', 'amazing', 'super', 'best', 'badhiya', 'mast', 'wow'].includes(textContent)) {
          responseText = `Thank you for the kind words! 🌟 Your success is our ultimate goal. Keep scrolling, keep learning!`;
        }
        // 9. Bot Identity
        else if (textContent.includes('who are you') || textContent.includes('tum kaun') || textContent.includes('bot')) {
          responseText = `I am the automated assistant for UPSC ZenScroll! 🤖 I'm here to help you navigate our resources instantly and connect you to our human support team if needed.`;
        }
        // 10. Login / Password Issues
        else if (['password', 'login', 'open nahi ho raha', 'khol nahi raha', 'log in', 'bhul gaya'].some(word => textContent.includes(word))) {
          responseText = `🔐 *Login & Password Help*\n\nAgar aap apna password bhul gaye hain ya login nahi kar pa rahe hain, to kripya niche click karke support ticket raise karein. Humari team turant aapse sampark karke password reset karne me madad karegi 👇`;
          inlineKeyboard = {
            inline_keyboard: [
              [{ text: '🔐 लॉगिन हेल्प दर्ज करें', callback_data: 'ISSUE_LOG_HI' }],
              [{ text: '🔙 मुख्य मेनू', callback_data: 'LANG_HI' }]
            ]
          };
        }
        // 11. Wait / Hold On
        else if (['ruko', 'ek minute', 'wait', 'hold', '1 min', 'thodi der'].some(word => textContent.includes(word))) {
          responseText = `Sure, take your time! ⏳\nWhenever you are ready to continue, just send a 'Hi' and I'll be right here.`;
        }
        // 12. Language Switch Request (Hindi)
        else if (['hindi', 'hindi me batao', 'hindi please', 'hindi medium'].some(word => textContent.includes(word))) {
          responseText = `जी बिल्कुल! हमारी पूरी प्रणाली हिंदी में उपलब्ध है।\n\nकृपया नीचे दिए गए बटन पर क्लिक करके हिंदी मेनू खोलें 👇`;
          inlineKeyboard = {
            inline_keyboard: [
              [{ text: 'हिंदी मेनू (Menu)', callback_data: 'LANG_HI' }]
            ]
          };
        }
        // 13. Discount / Offers / Promo Code
        else if (['discount', 'offer', 'kam kardo', 'concession', 'promo', 'coupon'].some(word => textContent.includes(word))) {
          responseText = `Humare sabhi plans already bohot affordable (student-friendly) prices par hain! 🎓\n\nAap current plans aur pricing yahan check kar sakte hain:\n🔗 https://upsc.zenscroll.app/pricing\n\nKya aapko plan select karne me koi aur madad chahiye? 👇`;
          inlineKeyboard = {
            inline_keyboard: [
              [{ text: 'सपोर्ट से बात करें', callback_data: 'SUPPORT_HI' }]
            ]
          };
        }
        // 14. Payment Failed / Amount Deducted
        else if (['fail', 'paise kat', 'deduct', 'amount cut', 'kat gaya', 'nahi hua'].some(word => textContent.includes(word))) {
          responseText = `💳 *Payment Issue*\n\nDon't worry at all! Humari support team is transaction ko turant system me check karegi aur aapki puri madad karegi.\n\nKripya niche click karke apna issue raise karein, humein thodi detail provide karein aur hum ise jald se jald resolve karenge 👇`;
          inlineKeyboard = {
            inline_keyboard: [
              [{ text: 'पेमेंट इश्यू दर्ज करें', callback_data: 'ISSUE_PAY_HI' }]
            ]
          };
        }
        // 15. Strategy / How to Study
        else if (['kaise padhu', 'strategy', 'notes kaise', 'kahan se', 'start karu', 'guidance'].some(word => textContent.includes(word))) {
          responseText = `📚 *UPSC Preparation Strategy*\n\nTaiyari ki sabse pehli seedhi hai 'Syllabus' ko samajhna aur 'PYQs' ko analyze karna.\n\nHumne specially UPSC ke liye ek detailed Syllabus Library banayi hai. Apna preparation yahan se shuru karein:\n🔗 https://upsc.zenscroll.app/syllabus`;
        }
        // 16. Human / Customer Care / Issues
        else if (['insaan', 'customer care', 'human', 'agent', 'real person', 'koi hai', 'baat karna', 'issue', 'problem', 'dikkat', 'samasya'].some(word => textContent.includes(word))) {
          responseText = `Aap bilkul humari support team se baat kar sakte hain! 👨‍💻\n\nKripya apni problem ya query yahan detail me type karke bhejein. Humari team jald hi aapse yahan chat par sampark karegi aur aapki madad karegi.`;
        }
        else {
          responseText = "We've received your request! A human agent will reply to you shortly.";
        }
      }
    } 
    else if (callbackData) {
      const data = callbackData;

      if (data === 'LANG_EN') {
        responseText = `Great! How can we help you today? 👇\n\n` +
          `📚 *Plans & Access*\n` +
          `Understand the direction for Prelims & Mains.\n\n` +
          `🔧 *Support Desk*\n` +
          `Facing login or access issues? Let us help!\n\n` +
          `🔗 *Free Resources*\n` +
          `Access the Syllabus Library, PYQs, and Blogs.`;

        inlineKeyboard = {
          inline_keyboard: [
            [{ text: '📚 Plans & Access', callback_data: 'INFO_PLANS_EN' }],
            [{ text: '🔧 Support Desk', callback_data: 'SUPPORT_EN' }],
            [{ text: '🔗 Free Resources', callback_data: 'MENU_EN' }]
          ]
        };
      } 
      else if (data === 'LANG_HI') {
        responseText = `बढ़िया! आज हम आपकी कैसे मदद कर सकते हैं? 👇\n\n` +
          `📚 *प्लान और एक्सेस*\n` +
          `Prelims और Mains की दिशा समझें।\n\n` +
          `🔧 *सपोर्ट और सहायता*\n` +
          `लॉगिन या एक्सेस में समस्या? हम मदद करेंगे!\n\n` +
          `🔗 *फ्री रिसोर्सेज*\n` +
          `Syllabus Library, PYQs, और ब्लॉग्स एक्सेस करें।`;

        inlineKeyboard = {
          inline_keyboard: [
            [{ text: '📚 प्लान और एक्सेस', callback_data: 'INFO_PLANS_HI' }],
            [{ text: '🔧 सपोर्ट और सहायता', callback_data: 'SUPPORT_HI' }],
            [{ text: '🔗 फ्री रिसोर्सेज', callback_data: 'MENU_HI' }]
          ]
        };
      }
      else if (data === 'INFO_PLANS_EN' || data === 'INFO_PLANS_HI') {
        const isHi = data.endsWith('_HI');
        responseText = isHi 
          ? `🚀 *UPSC ZenScroll*\n\n` +
            `हर गंभीर अभ्यर्थी के पास किताबें, नोट्स और PDFs होते हैं।\n` +
            `फिर भी अक्सर प्रश्न वही रहते हैं:\n\n` +
            `❓ क्या पढ़ना है?\n` +
            `❓ कितना पढ़ना है?\n` +
            `❓ PYQs से वास्तव में क्या सीखना है?\n` +
            `❓ Mains में उत्तर की दिशा कैसे समझनी है?\n\n` +
            `━━━━━━━━━━━━\n` +
            `📖 *Prelims Library*\n` +
            `Syllabus Understanding • PYQ Connections\n\n` +
            `🏛️ *Mains Library*\n` +
            `Question Demand • Answer Frameworks\n\n` +
            `🎯 *Complete Preparation*\n` +
            `Integrated Learning. Structured & Revision Friendly.\n\n` +
            `🔗 [यहाँ एक्सप्लोर करें](https://upsc.zenscroll.app/pricing)\n\n` +
            `क्या आपको कोई समस्या आ रही है? 👇`
          : `🚀 *UPSC ZenScroll*\n\n` +
            `Every serious aspirant has books, notes, and PDFs.\n` +
            `Yet, the core questions remain:\n\n` +
            `❓ What to study?\n` +
            `❓ How much to study?\n` +
            `❓ What to actually learn from PYQs?\n` +
            `❓ How to understand the direction of Mains answers?\n\n` +
            `━━━━━━━━━━━━\n` +
            `📖 *Prelims Library*\n` +
            `Syllabus Understanding • PYQ Connections\n\n` +
            `🏛️ *Mains Library*\n` +
            `Question Demand • Answer Frameworks\n\n` +
            `🎯 *Complete Preparation*\n` +
            `Integrated Learning. Structured & Revision Friendly.\n\n` +
            `🔗 [Explore Here](https://upsc.zenscroll.app/pricing)\n\n` +
            `Are you facing any issues? 👇`;
        
        inlineKeyboard = {
          inline_keyboard: [
            [{ text: isHi ? '🔧 ऐप सपोर्ट' : '🔧 App Support', callback_data: isHi ? 'SUPPORT_HI' : 'SUPPORT_EN' }],
            [{ text: isHi ? '🔙 मुख्य मेनू' : '🔙 Main Menu', callback_data: isHi ? 'LANG_HI' : 'LANG_EN' }]
          ]
        };
      }
      else if (data === 'MENU_EN') {
        responseText = `🌐 *UPSC ZenScroll Resources*\n\n` +
          `Preparation becomes easier when direction is clear.\n` +
          `Please select a paper to explore its deep structure: 👇`;

        inlineKeyboard = {
          inline_keyboard: [
            [{ text: '📘 GS 1 (History, Geo, Society)', callback_data: 'PAPER_GS1_EN' }],
            [{ text: '📗 GS 2 (Polity, Gov, IR)', callback_data: 'PAPER_GS2_EN' }],
            [{ text: '📙 GS 3 (Economy, Env, S&T)', callback_data: 'PAPER_GS3_EN' }],
            [{ text: '📕 GS 4 (Ethics & Aptitude)', callback_data: 'PAPER_GS4_EN' }],
            [{ text: '🎯 Prelims GS', callback_data: 'PAPER_PRE_EN' }],
            [{ text: '🔙 Main Menu', callback_data: 'LANG_EN' }]
          ]
        };
      } 
      else if (data === 'MENU_HI') {
        responseText = `🌐 *UPSC ZenScroll Resources*\n\n` +
          `तैयारी तब आसान हो जाती है जब दिशा स्पष्ट हो।\n` +
          `कृपया सिलेबस और संरचना देखने के लिए एक पेपर चुनें: 👇`;

        inlineKeyboard = {
          inline_keyboard: [
            [{ text: '📘 GS 1 (इतिहास, भूगोल, समाज)', callback_data: 'PAPER_GS1_HI' }],
            [{ text: '📗 GS 2 (राजव्यवस्था, शासन, IR)', callback_data: 'PAPER_GS2_HI' }],
            [{ text: '📙 GS 3 (अर्थव्यवस्था, पर्यावरण)', callback_data: 'PAPER_GS3_HI' }],
            [{ text: '📕 GS 4 (नीतिशास्त्र व सत्यनिष्ठा)', callback_data: 'PAPER_GS4_HI' }],
            [{ text: '🎯 Prelims GS', callback_data: 'PAPER_PRE_HI' }],
            [{ text: '🔙 मुख्य मेनू', callback_data: 'LANG_HI' }]
          ]
        };
      }
      else if (data && data.startsWith('PAPER_')) {
        const isHi = data.endsWith('_HI');
        const paper = data.replace('PAPER_', '').replace('_EN', '').replace('_HI', '');
        
        let pTitle = '';
        let pDesc = '';
        let url = 'https://upsc.zenscroll.app/syllabus';
        
        if (paper === 'GS1') {
          pTitle = isHi ? '📘 GS Paper 1' : '📘 GS Paper 1';
          pDesc = isHi 
            ? `भारतीय विरासत और संस्कृति, विश्व का इतिहास एवं भूगोल और समाज।\n\n` +
              `📌 *Key Areas:*\n` +
              `• Art & Culture\n• Modern History\n• Post-Independence\n• World History\n• Indian Society\n• Physical Geography`
            : `Indian Heritage and Culture, History and Geography of the World and Society.\n\n` +
              `📌 *Key Areas:*\n` +
              `• Art & Culture\n• Modern History\n• Post-Independence\n• World History\n• Indian Society\n• Physical Geography`;
          url = 'https://upsc.zenscroll.app/mains';
        } else if (paper === 'GS2') {
          pTitle = isHi ? '📗 GS Paper 2' : '📗 GS Paper 2';
          pDesc = isHi 
            ? `शासन व्यवस्था, संविधान, राजव्यवस्था, सामाजिक न्याय तथा अंतर्राष्ट्रीय संबंध।\n\n` +
              `📌 *Key Areas:*\n` +
              `• Indian Constitution\n• Governance\n• Social Justice\n• International Relations`
            : `Governance, Constitution, Polity, Social Justice and International relations.\n\n` +
              `📌 *Key Areas:*\n` +
              `• Indian Constitution\n• Governance\n• Social Justice\n• International Relations`;
          url = 'https://upsc.zenscroll.app/mains';
        } else if (paper === 'GS3') {
          pTitle = isHi ? '📙 GS Paper 3' : '📙 GS Paper 3';
          pDesc = isHi 
            ? `प्रौद्योगिकी, आर्थिक विकास, जैव विविधता, पर्यावरण, सुरक्षा तथा आपदा प्रबंधन।\n\n` +
              `📌 *Key Areas:*\n` +
              `• Indian Economy\n• Agriculture\n• Science & Tech\n• Environment\n• Internal Security\n• Disaster Management`
            : `Technology, Economic Development, Bio-diversity, Environment, Security and Disaster Management.\n\n` +
              `📌 *Key Areas:*\n` +
              `• Indian Economy\n• Agriculture\n• Science & Tech\n• Environment\n• Internal Security\n• Disaster Management`;
          url = 'https://upsc.zenscroll.app/mains';
        } else if (paper === 'GS4') {
          pTitle = isHi ? '📕 GS Paper 4' : '📕 GS Paper 4';
          pDesc = isHi 
            ? `नीतिशास्त्र, सत्यनिष्ठा और अभिरुचि।\n\n` +
              `📌 *Key Areas:*\n` +
              `• Ethics & Human Interface\n• Attitude & Emotional Intelligence\n• Probity in Governance\n• Case Studies`
            : `Ethics, Integrity and Aptitude.\n\n` +
              `📌 *Key Areas:*\n` +
              `• Ethics & Human Interface\n• Attitude & Emotional Intelligence\n• Probity in Governance\n• Case Studies`;
          url = 'https://upsc.zenscroll.app/mains';
        } else if (paper === 'PRE') {
          pTitle = isHi ? '🎯 Prelims GS' : '🎯 Prelims GS';
          pDesc = isHi 
            ? `प्रारंभिक परीक्षा - सामान्य अध्ययन।\n\n` +
              `📌 *Key Areas:*\n` +
              `• History of India\n• Indian & World Geography\n• Indian Polity\n• Economic Development\n• General Science\n• Current Events`
            : `Preliminary Examination - General Studies.\n\n` +
              `📌 *Key Areas:*\n` +
              `• History of India\n• Indian & World Geography\n• Indian Polity\n• Economic Development\n• General Science\n• Current Events`;
          url = 'https://upsc.zenscroll.app/syllabus';
        }

        responseText = `*${pTitle}*\n\n${pDesc}\n\n` +
          (isHi 
            ? `वेबसाइट पर विस्तृत सिलेबस, PYQs और स्मार्ट नोट्स देखने के लिए नीचे क्लिक करें:`
            : `Click below to view the detailed syllabus, PYQs, and smart notes on the website:`);

        inlineKeyboard = {
          inline_keyboard: [
            [{ text: isHi ? '🌐 वेबसाइट पर खोलें' : '🌐 Open in Website', url: url }],
            [{ text: isHi ? '🔙 वापस जाएँ' : '🔙 Go Back', callback_data: isHi ? 'MENU_HI' : 'MENU_EN' }]
          ]
        };
      }
      else if (data === 'SUPPORT_EN' || data === 'SUPPORT_HI') {
        const isHi = data.endsWith('_HI');
        responseText = isHi
          ? `🔧 *सपोर्ट डेस्क*\nआपको किस प्रकार की सहायता की आवश्यकता है? 👇`
          : `🔧 *Support Desk*\nWhat kind of assistance do you need? 👇`;

        inlineKeyboard = {
          inline_keyboard: [
            [{ text: isHi ? '💳 पेमेंट इश्यू' : '💳 Payment Issue', callback_data: isHi ? 'ISSUE_PAY_HI' : 'ISSUE_PAY_EN' }],
            [{ text: isHi ? '🔐 लॉगिन इश्यू' : '🔐 Login Issue', callback_data: isHi ? 'ISSUE_LOG_HI' : 'ISSUE_LOG_EN' }],
            [{ text: isHi ? '💬 अन्य प्रश्न' : '💬 Other Query', callback_data: isHi ? 'ISSUE_OTH_HI' : 'ISSUE_OTH_EN' }]
          ]
        };
      }
      else if (data && data.startsWith('ISSUE_')) {
        const isHi = data.endsWith('_HI');
        
        let issueType = "Other Query";
        if (data.includes('_PAY_')) issueType = "Payment Issue";
        if (data.includes('_LOG_')) issueType = "Login Issue";
        
        responseText = isHi
          ? `🎫 *Support Request Received*\n\n` +
            `आपकी क्वेरी (${issueType}) हमारे पास पहुँच गई है।\n` +
            `हमारी टीम जल्द ही आपकी सहायता करने की कोशिश करेगी।\n\n` +
            `*UPSC ZenScroll Team*\n\n` +
            `कृपया अपनी समस्या या प्रश्न नीचे विस्तार से लिखें।\n` +
            `जितनी स्पष्ट जानकारी देंगे, उतनी जल्दी सहायता मिल पाएगी। 👇`
          : `🎫 *Support Request Received*\n\n` +
            `Your query (${issueType}) has reached us.\n` +
            `Our team will try to assist you shortly.\n\n` +
            `*UPSC ZenScroll Team*\n\n` +
            `Please write your exact issue or question in detail below.\n` +
            `The clearer the details, the faster we can resolve it! 👇`;
        
        const timeOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' };
        const formattedTime = new Date().toLocaleString('en-IN', timeOptions);

        // Alert Admin via Telegram
        await sendHumanRequestTelegramNotification(
          `🚨 <b>Human Support Requested (UPSC)!</b> 🚨\n\n` +
          `👤 <b>Student:</b> ${guestName}\n` +
          `💬 <b>Chat ID:</b> ${chatId}\n` +
          `🔵 <b>Platform:</b> Telegram Bot\n` +
          `📌 <b>Issue Type:</b> ${issueType}\n` +
          `⏰ <b>Time:</b> ${formattedTime}\n\n` +
          `⚡ <i>Please reply via the Admin Support Inbox.</i>`
        );
      }
      else if (data === 'FDBK_EXC' || data === 'FDBK_AVG') {
        responseText = `🌟 बहुत-बहुत धन्यवाद! आपके फीडबैक से हमें और बेहतर काम करने की प्रेरणा मिलती है।\n\nकिसी और जानकारी के लिए कृपया 'Hi' भेजें।\n\n(Thank you for your feedback! Send 'Hi' to start again.)`;
      }
      else if (data === 'FDBK_BAD') {
        responseText = `😞 हमें खेद है कि आपको हमारा सपोर्ट पसंद नहीं आया।\n\nक्या आप हमें बता सकते हैं कि क्या समस्या रही? आपके सुझाव से हम खुद को बेहतर बना सकते हैं! (कृपया अपना जवाब टाइप करके भेजें)`;
      }
      else {
        responseText = "We've received your request! A human agent will reply to you shortly.";
      }
    }

    // 5. Send Response to Telegram
    if (chatId && responseText) {
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText,
          parse_mode: 'Markdown',
          reply_markup: inlineKeyboard ? inlineKeyboard : undefined
        }),
      });

      // DB: Save Outgoing Bot Message
      if (convId) {
        await saveOutgoingMessage(convId, responseText, 'bot');
      }
    }

    // Always return 200 OK so Telegram doesn't retry
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

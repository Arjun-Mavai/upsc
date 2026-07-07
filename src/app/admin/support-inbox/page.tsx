'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Check, CheckCheck, MoreVertical, Phone, Globe, ChevronLeft, MessageCircleOff, ChevronDown, Bot, Power, X, Loader2, Heart, AlertCircle, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getConversations, getMessages, sendAdminReply, markAsRead, resolveConversation, toggleHumanActive } from '@/actions/support-inbox-actions';
import { toast } from 'sonner';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

type Message = {
  id: string;
  text: string;
  sender: 'bot' | 'user' | 'admin';
  timestamp: string;
  status?: string | null;
  messageType?: string | null;
  mediaUrl?: string | null;
  isOptimistic?: boolean;
};

type Conversation = {
  id: string;
  guestName: string;
  guestPhone: string;
  lastMessageAt: Date;
  unreadCount: number;
  platform: 'whatsapp' | 'telegram';
  language: string;
  humanActive: boolean;
};

export default function SupportInbox() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      if (fullscreenImage) {
        setFullscreenImage(null);
      }
    };

    if (fullscreenImage) {
      window.history.pushState({ modal: 'fullscreenImage' }, '', window.location.href);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [fullscreenImage]);

  const { data: conversations = [] } = useQuery({
    queryKey: ['support-conversations'],
    queryFn: async () => {
      const res = await getConversations();
      return res.success ? (res.conversations as Conversation[]) : [];
    },
    refetchInterval: 10000,
  });

  const { data: activeMessages = [], isLoading: isLoadingMessages } = useQuery({
    queryKey: ['support-messages', activeId],
    queryFn: async (): Promise<Message[]> => {
      if (!activeId) return [];
      const res = await getMessages(activeId);
      if (res.success) {
        const formatted: Message[] = res.messages.map((m: any) => ({
          id: m.id,
          text: m.text,
          sender: m.sender as 'bot' | 'user' | 'admin',
          status: m.status,
          messageType: m.messageType,
          mediaUrl: m.mediaUrl,
          timestamp: new Date(m.createdAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOptimistic: false
        }));
        
        markAsRead(activeId).catch(console.error);
        return formatted;
      }
      return [];
    },
    refetchInterval: 5000,
    enabled: !!activeId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ text, opts }: { text: string; opts?: any }) => {
      const res = await sendAdminReply(activeId!, text, opts);
      if (!res.success) throw new Error((res as any).error || 'Failed to send message');
      return res;
    },
    onMutate: async ({ text }) => {
      await queryClient.cancelQueries({ queryKey: ['support-messages', activeId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['support-messages', activeId]);
      
      const newMessage: Message = {
        id: `opt-${Date.now()}`,
        text,
        sender: 'admin',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOptimistic: true,
        status: 'sending'
      };

      queryClient.setQueryData(['support-messages', activeId], (old: Message[] = []) => [...old, newMessage]);
      return { previousMessages };
    },
    onError: (err, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['support-messages', activeId], context.previousMessages);
      }
      toast.error('Failed to send message: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['support-messages', activeId] });
      queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
    },
  });

  const toggleBotMutation = useMutation({
    mutationFn: async (newStatus: boolean) => {
      const res = await toggleHumanActive(activeId!, newStatus);
      if (!res.success) throw new Error('Failed to toggle bot');
      return res;
    },
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({ queryKey: ['support-conversations'] });
      const previousConversations = queryClient.getQueryData<Conversation[]>(['support-conversations']);
      
      queryClient.setQueryData(['support-conversations'], (old: Conversation[] = []) => 
        old.map(c => c.id === activeId ? { ...c, humanActive: newStatus } : c)
      );
      
      return { previousConversations };
    },
    onError: (err, variables, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(['support-conversations'], context.previousConversations);
      }
      toast.error('Failed to toggle status: ' + err.message);
    },
    onSuccess: (data, newStatus) => {
      toast.success(newStatus ? 'Bot Paused (Human mode)' : 'Bot Activated');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
      setShowScrollBottom(!isAtBottom);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages.length, activeId]);

  const activeConversation = conversations.find(c => c.id === activeId);

  const handleSend = () => {
    if ((!replyText.trim() && !attachedImage) || !activeId || !activeConversation) return;
    sendMessageMutation.mutate({ text: replyText, opts: { mediaUrl: attachedImage } });
    setReplyText('');
    setAttachedImage(null);
  };

  const handleResolveFeedback = async () => {
    if (!activeId || !activeConversation) return;
    
    const textToSend = '✅ क्या आपकी समस्या का समाधान हो गया है? (Has your query been resolved?)\n\nआपको हमारा सपोर्ट कैसा लगा? कृपया नीचे दिए गए बटनों में से कोई एक चुनें (How was your experience?):\n\nRegards,\n*UPSC ZenScroll Team*';
    
    sendMessageMutation.mutate({ 
      text: textToSend,
      opts: {
        buttons: [
          { id: 'FDBK_EXC', title: '🤩 बहुत बढ़िया' },
          { id: 'FDBK_AVG', title: '👍 ठीक था' },
          { id: 'FDBK_BAD', title: '😞 बेकार' }
        ]
      }
    });
    
    // Also resolve conversation in background
    resolveConversation(activeId).catch(console.error);
  };

  const handleGeneralFeedback = async () => {
    if (!activeId || !activeConversation) return;
    
    const textToSend = 'नमस्ते! 🙏\n\nबातचीत के बाद आपसे फीडबैक लेना चाहते हैं। आपको हमारा सपोर्ट और गाइडेंस कैसा लगा? कृपया नीचे दिए गए बटनों में से कोई एक चुनें:\n\nRegards,\n*UPSC ZenScroll Team*';
    
    sendMessageMutation.mutate({ 
      text: textToSend,
      opts: {
        buttons: [
          { id: 'FDBK_EXC', title: '🤩 बहुत बढ़िया' },
          { id: 'FDBK_AVG', title: '👍 ठीक था' },
          { id: 'FDBK_BAD', title: '😞 बेकार' }
        ]
      }
    });
  };

  const handleToggleBot = () => {
    if (!activeId || !activeConversation) return;
    toggleBotMutation.mutate(!activeConversation.humanActive);
  };

  const QUICK_REPLIES = [
    { label: '👋 Hi (Hindi)', text: 'नमस्ते! 🙏\n\nमैं अर्जुन बात कर रहा हूँ। UPSC ZenScroll की सपोर्ट टीम से जुड़ने के लिए धन्यवाद।\n\nमैं आज आपकी क्या सहायता कर सकता हूँ?\n\nRegards,\nArjun\n*UPSC ZenScroll Team*' },
    { label: '👋 Hi (English)', text: 'Hello! 🙏\n\nThis is Arjun. Thank you for reaching out to UPSC ZenScroll support.\n\nHow can I help you today?\n\nRegards,\nArjun\n*UPSC ZenScroll Team*' },
    { label: '🔗 Pre + Mains Links', text: '🎯 *UPSC ZenScroll - Active Libraries* 🚀\n\nनमस्ते! 🙏\n\nआप अपनी तैयारी के अनुसार नीचे दिए गए डायरेक्ट लिंक्स से हमारी लाइब्रेरीज को एक्सप्लोर कर सकते हैं:\n\n💻 *Home (Prelims Library):*\n👉 https://upsc.zenscroll.app\n\n🏛️ *Mains Library (Syllabus & Model Answers):*\n👉 https://upsc.zenscroll.app/mains\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '💡 Pre Strategy Advice', text: '💡 *UPSC Prelims - ZenScroll Strategy* 🎯\n\nनमस्ते! 🙏\n\nPrelims की तैयारी को लेकर हमारी एप्रोच बहुत सिंपल है:\n\n1️⃣ *Syllabus की गहरी समझ:* रटने से पहले पूरे सिलेबस (Unit-wise) को माइक्रो-लेवल पर समझें।\n2️⃣ *PYQs का गहरा विश्लेषण:* पिछले साल के प्रश्नों (PYQs) को समझें ताकि पता चले कि आयोग किस तरह के प्रश्न और फैक्ट्स पूछ रहा है।\n3️⃣ *Clarity Before Content:* पहले अपनी समझ मजबूत करें, फिर कंटेंट पढ़ें।\n\nअपनी तैयारी शुरू करने के लिए यहाँ जाएँ:\n🔗 Home / Prelims: https://upsc.zenscroll.app\n🔗 Free Demo Quiz: https://upsc.zenscroll.app/free-quiz\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '💡 Mains Strategy Advice', text: '💡 *UPSC Mains - ZenScroll Strategy* 🏛️\n\nनमस्ते! 🙏\n\nMains परीक्षा (2024 New Syllabus) को क्रैक करने के लिए हमारी थिंकिंग:\n\n1️⃣ *Keyword Level Decoding:* सिलेबस के हर एक टॉपिक पर आपके पास 3, 5, और 11 markers के पॉइंट तैयार होने चाहिए।\n2️⃣ *PYQ Integration:* टॉपिक को पुराने साल के प्रश्नों से लिंक करके पढ़ें ताकि एग्जाम का पैटर्न समझ आए।\n3️⃣ *Answer Thinking (उत्तर सोचने का तरीका):* नोट्स रटने के बजाय सही उत्तर लिखने की एप्रोच सीखें।\n\nमैल्यू-ऐडेड नोट्स और मॉडल उत्तर देखने के लिए यहाँ जाएँ:\n🔗 Mains Library: https://upsc.zenscroll.app/mains\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '💳 Pre Payment', text: '🎯 *Prelims Intelligence Course*\n\nनमस्ते! 🙏\nCourse access ke liye aap apna secure payment yahan se complete kar sakte hain:\n\n🔗 Payment Link: https://upsc.zenscroll.app/pricing?need=pre\n\n⚡ (Payment complete hone ke baad please yahan ek screenshot bhej dijiye!)\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '💳 Mains Payment', text: '🏛️ *Mains Syllabus Hub*\n\nनमस्ते! 🙏\nCourse access ke liye aap apna secure payment yahan se complete kar sakte hain:\n\n🔗 Payment Link: https://upsc.zenscroll.app/pricing?need=mains\n\n⚡ (Payment complete hone ke baad please yahan ek screenshot bhej dijiye!)\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '💳 Combo Plan', text: '🏛️ *Combo Plan (Prelims + Mains)*\n\nनमस्ते! 🙏\nPrelims and Mains dono courses ko join karne ke liye secure payment complete karein:\n\n🔗 Pricing Page: https://upsc.zenscroll.app/pricing\n\n👉 Direct Prelims: https://upsc.zenscroll.app/pricing?need=pre\n👉 Direct Mains: https://upsc.zenscroll.app/pricing?need=mains\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '⚙️ Tech Fixed', text: '🛠️ *Issue Resolved / तकनीकी समस्या हल*\n\nनमस्ते! 🙏\nAapne jo issue report kiya tha, humari technical team ne use successfully resolve kar diya hai.\n\nKripya ek baar website ko refresh karein aur check karein.\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '⏳ Follow up', text: '⏳ *Awaiting Your Reply / प्रतीक्षा*\n\nनमस्ते! 🙏\nHum aapke reply ka wait kar rahe hain. Agar aapko abhi bhi koi doubt ya issue hai, toh please humein batayein.\n\nHum aapki help karne ke liye ready hain!\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '🔐 Login Issue', text: '🔐 *Login Assistance /ログイン सहायता*\n\nनमस्ते! 🙏\nLogin karne me issue aa raha hai?\n\nPlease make sure ki aap exactly usi Google Account (Gmail) se login karein, jisse aapne payment kiya tha. Agar aapko yaad nahi hai toh please yahan apna email id likh kar bhej dein.\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '🎯 Pre Strategy', text: '🎯 *UPSC Prelims 2026 - Master Strategy*\n\nनमस्ते! 🙏\nAgar aap UPSC Prelims ki taiyari ekdum ZERO se start kar rahe hain, toh humne aapke liye ek detailed step-by-step strategy blog banaya hai.\n\nIse dhyaan se padhein:\n🔗 https://upsc.zenscroll.app/blogs/how-to-crack-upsc-prelims-2026-strategy?from=category%3Dgeneral\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '🏛️ Mains Strategy', text: '🏛️ *UPSC Mains - Zero to Selection Strategy*\n\nनमस्ते! 🙏\nUPSC Mains ke naye syllabus (2024) ko samajhne aur answer writing master karne ke liye humara yeh comprehensive blog zarur padhein.\n\nLink par click karein:\n🔗 https://upsc.zenscroll.app/blogs/upsc-mains-master-strategy-2024-zero-to-selection-comprehensive\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '🎁 Free Resources', text: '🎁 *Explore UPSC ZenScroll Free Resources*\n\nनमस्ते! 🙏\nUPSC ki taiyari ko directional aur simple banane ke liye humare saare free resources check karein:\n\n🎯 *Prelims Library & Demo:*\n👉 Attempt Free Demo Quiz:\n🔗 https://upsc.zenscroll.app/free-quiz\n👉 Track Syllabus Unit-wise:\n🔗 https://upsc.zenscroll.app/syllabus\n\n🏛️ *Mains Library:*\n👉 Explore Syllabus Map & Model Answer Frameworks:\n🔗 https://upsc.zenscroll.app/mains\n\n📝 *Strategy Blogs & Preparation Tips:*\n🔗 https://upsc.zenscroll.app/blogs\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '📱 App Download', text: '📱 *UPSC ZenScroll App Install Guide*\n\nनमस्ते! 🙏\nZenScroll fast aur lightweight Web-App hai. Ise install karne ke liye niche diye step-by-step points check karein:\n\n🤖 *For Android Users (Chrome):*\n1️⃣ Open: 🔗 https://upsc.zenscroll.app\n2️⃣ Click **Three Dots (⋮)** in top right corner.\n3️⃣ Tap **"Add to Home screen"**.\n4️⃣ Click **"Add"** again. Done! 🎉\n\n🍎 *For iPhone Users (Safari):*\n1️⃣ Open: 🔗 https://upsc.zenscroll.app\n2️⃣ Tap **Share icon** (square with up arrow) at bottom.\n3️⃣ Scroll down & tap **"Add to Home Screen"** ➕.\n4️⃣ Tap **"Add"** in top right. Done! 🎉\n\nAb aap ZenScroll ko direct app ki tarah use kar sakte hain! 🚀\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '📄 2026 Paper Solution', text: '📄 *UPSC 2026 Official Prelims Paper Solution*\n\nनमस्ते! 🙏\nHumne UPSC 2026 ka Prelims Paper detailed analytics aur official answer key ke sath upload kar diya hai.\n\n🔗 Paper Solution yahan check karein: https://upsc.zenscroll.app/paper-solution\n\nRegards,\n*UPSC ZenScroll Team*' },
    { label: '📞 Request Call', text: '📞 *Schedule a Call / कॉल बुक करें*\n\nनमस्ते! 🙏\nAapka sawal thoda detail me hai, toh ise ache se samajhne ke liye humein call par baat karni hogi.\n\nKripya humein call karne ke liye aaj ka ek sahi samay batayein.\n\nRegards,\n*UPSC ZenScroll Team*' },
  ];

  const filteredConversations = conversations.filter(c => 
    c.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.guestPhone?.includes(searchQuery)
  );

  return (
    <div className="fixed top-14 bottom-0 left-0 right-0 lg:top-0 lg:left-64 flex bg-zinc-50 overflow-hidden font-sans z-40">
      
      {/* LEFT PANEL */}
      <div className={cn(
        "flex-col border-r border-zinc-200 bg-white transition-all w-full md:w-80 lg:w-96 flex min-h-0",
        activeId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-zinc-200 bg-white shrink-0">
          <h1 className="text-xl font-semibold text-zinc-900 mb-4">Support Inbox</h1>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-zinc-400 text-sm">No conversations found.</div>
          ) : filteredConversations.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                setActiveId(chat.id);
              }}

              className={cn(
                "cursor-pointer border-b border-zinc-100 p-4 transition-colors hover:bg-zinc-50",
                activeId === chat.id ? "bg-indigo-50/50" : ""
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-medium text-zinc-900 text-sm truncate pr-2">{chat.guestName}</h3>
                <span className="text-xs text-zinc-400 whitespace-nowrap">
                  {new Date(chat.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <p className="text-xs text-zinc-500 truncate mb-2">{chat.guestPhone}</p>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1",
                  chat.platform === 'whatsapp' ? "border-[#25D366]/30 bg-[#25D366]/10 text-[#075E54]" : "border-[#24A1DE]/30 bg-[#24A1DE]/10 text-[#24A1DE]"
                )}>
                  {chat.platform === 'whatsapp' ? (
                    <>
                      <svg className="w-3 h-3 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg> WhatsApp
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 text-[#24A1DE]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.888-.662 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> Telegram
                    </>
                  )}
                </span>
                
                {chat.unreadCount > 0 && (
                  <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    {chat.unreadCount} New
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      {activeId && activeConversation ? (
        <div className={cn(
          "flex-col flex-1 bg-[#efeae2] flex overflow-hidden min-h-0 min-w-0",
          !activeId ? "hidden md:flex" : "flex"
        )}>
          {/* Header */}
          <div className="h-16 flex items-center px-4 bg-[#f0f2f5] border-b border-[#d1d7db] shrink-0 shadow-sm z-10">
            <button
              onClick={() => {
                setActiveId(null);
              }}

              className="mr-3 md:hidden p-2 -ml-2 text-zinc-600 hover:bg-zinc-200 rounded-full transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="h-10 w-10 rounded-full bg-zinc-300 flex items-center justify-center mr-3 shrink-0 overflow-hidden">
              <span className="text-zinc-600 font-bold text-lg">{activeConversation.guestName?.charAt(0).toUpperCase() || '?'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-[#111b21] text-sm md:text-base truncate">{activeConversation.guestName}</h2>
              <p className="text-xs text-[#667781] flex items-center gap-1 truncate">
                <Phone size={10} className="shrink-0" /> {activeConversation.guestPhone} • Last active: {new Date(activeConversation.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
            
            {/* Bot Toggle Control */}
            <button
              onClick={handleToggleBot}
              disabled={toggleBotMutation.isPending}
              className={cn(
                "ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all border disabled:opacity-50",
                activeConversation.humanActive 
                  ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200" 
                  : "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200"
              )}
              title={activeConversation.humanActive ? "Bot is paused. Click to activate bot." : "Bot is active. Click to pause bot."}
            >
              {toggleBotMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : activeConversation.humanActive ? (
                <><Power size={14} className="text-amber-600" /> Bot Paused</>
              ) : (
                <><Bot size={14} className="text-emerald-600" /> Bot Active</>
              )}
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3 flex flex-col bg-[#efeae2] bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat relative"
          >
            <div className="absolute inset-0 bg-white/40 pointer-events-none"></div> 
            
            <div className="text-center my-2 relative z-10">
              <span className="bg-[#ffeecd] text-[#54656f] text-xs px-3 py-1 rounded-lg shadow-sm">
                WhatsApp API does not provide Online or Last Seen statuses.
              </span>
            </div>

            {activeMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex w-full relative z-10",
                  msg.sender === 'user' ? "justify-start" : "justify-end"
                )}
              >
                <div className={cn(
                  "max-w-[85%] md:max-w-[65%] rounded-lg px-3 py-1.5 text-[14.2px] shadow-sm relative",
                  msg.sender === 'user' 
                    ? "bg-white text-[#111b21] rounded-tl-none" 
                    : msg.sender === 'bot'
                      ? "bg-zinc-800 text-white rounded-tr-none"
                      : "bg-[#d9fdd3] text-[#111b21] rounded-tr-none",
                  msg.isOptimistic && "opacity-70"
                )}>
                  {msg.sender !== 'user' && (
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider mb-0.5 block",
                      msg.sender === 'bot' ? "text-zinc-400" : "text-emerald-700"
                    )}>
                      {msg.sender === 'bot' ? '🤖 Bot' : 'Admin'}
                    </span>
                  )}
                  
                  {msg.mediaUrl ? (
                    <div className="mb-1 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `/api/whatsapp/media?id=${msg.mediaUrl}`} 
                        alt="Attached media" 
                        className="max-w-full h-auto object-cover max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                        loading="lazy"
                        onClick={() => setFullscreenImage(msg.mediaUrl!.startsWith('http') ? msg.mediaUrl! : `/api/whatsapp/media?id=${msg.mediaUrl}`)}
                      />
                      {msg.text && msg.text !== '[IMAGE]' && (
                        <p className="p-2 text-xs leading-snug whitespace-pre-wrap break-words border-t border-zinc-200 bg-white">
                          {msg.text.replace(/^\[IMAGE\]\s*/, '')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="leading-snug whitespace-pre-wrap break-words">{msg.text}</p>
                  )}
                  
                  <div className={cn(
                    "flex items-center justify-end gap-1 mt-0.5 -mb-0.5 text-[#667781]"
                  )}>
                    <span className="text-[10px] opacity-80">{msg.timestamp}</span>
                    {msg.sender !== 'user' && !msg.isOptimistic && (
                      msg.status === 'read' || msg.status === 'READ' ? <CheckCheck size={14} className="text-[#53bdeb]" /> :
                      msg.status === 'delivered' || msg.status === 'DELIVERED' ? <CheckCheck size={14} className="text-[#8696a0]" /> :
                      msg.status === 'failed' || msg.status === 'FAILED' ? <span title="Message Failed"><AlertCircle size={14} className="text-red-500" /></span> :
                      <Check size={14} className="text-[#8696a0]" />
                    )}
                    {msg.isOptimistic && <Loader2 size={10} className="animate-spin" />}
                  </div>
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} className="h-1 shrink-0" />
            
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="sticky bottom-2 right-2 ml-auto z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#54656f] shadow-md border border-[#d1d7db] hover:bg-zinc-50 transition-all"
              >
                <ChevronDown size={20} />
              </button>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 w-full bg-[#f0f2f5] border-t border-[#d1d7db] flex flex-col">
            <div className="flex overflow-x-auto gap-2 px-4 py-2 scrollbar-hide items-center bg-[#f0f2f5]">
              <button
                onClick={handleResolveFeedback}
                disabled={sendMessageMutation.isPending}
                className="whitespace-nowrap rounded-full bg-white border border-[#d1d7db] px-3 py-1.5 text-xs font-semibold text-[#54656f] shadow-sm hover:bg-zinc-50 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <CheckCheck size={14} className="text-emerald-500" /> Resolve & Ask Feedback
              </button>
              <button
                onClick={handleGeneralFeedback}
                disabled={sendMessageMutation.isPending}
                className="whitespace-nowrap rounded-full bg-white border border-[#d1d7db] px-3 py-1.5 text-xs font-semibold text-[#54656f] shadow-sm hover:bg-zinc-50 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <Heart size={14} className="text-rose-500" /> Ask General Feedback
              </button>
              <div className="w-px h-6 bg-[#d1d7db] mx-1 shrink-0"></div>
              {QUICK_REPLIES.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => setReplyText(qr.text)}
                  className="whitespace-nowrap rounded-full border border-[#d1d7db] bg-white px-3 py-1.5 text-xs font-medium text-[#54656f] shadow-sm hover:bg-zinc-50 transition-colors"
                >
                  {qr.label}
                </button>
              ))}
            </div>
            
            {attachedImage && (
              <div className="px-4 pt-4 relative">
                <div className="relative inline-block border-2 border-indigo-200 rounded-lg overflow-hidden w-24 h-24 bg-zinc-100 shadow-sm">
                  <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black transition-colors"
                    title="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            
            <div className="px-4 py-2 flex items-end gap-2 pb-4">

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type a message"
                className="flex-1 max-h-32 min-h-[44px] resize-none rounded-xl border-none bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-0 shadow-sm"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button 
                onClick={handleSend}
                disabled={(!replyText.trim() && !attachedImage) || sendMessageMutation.isPending}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none",
                  (replyText.trim() || attachedImage) ? "bg-[#00a884] hover:bg-[#008f6f]" : "bg-[#8696a0]"
                )}
              >
                {sendMessageMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#f0f2f5] flex-col text-[#8696a0] border-b-[6px] border-[#00a884]">
          <div className="w-80 h-80 opacity-50 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] absolute pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#d1d7db] flex items-center justify-center mb-6">
              <MessageCircleOff size={32} className="text-[#8696a0]" />
            </div>
            <h1 className="text-3xl font-light text-[#41525d] mb-4">UPSC Support Inbox</h1>
            <p className="text-sm font-medium">Select a chat to start messaging</p>
            <p className="text-xs mt-2 opacity-80">End-to-end encryption is managed by WhatsApp Business API.</p>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE MODAL */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (window.history.state?.modal === 'fullscreenImage') {
                window.history.back();
              } else {
                setFullscreenImage(null);
              }
            }}
            className="absolute top-4 right-4 text-white hover:text-zinc-300 z-[110] p-2 bg-black/50 rounded-full"
          >
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={fullscreenImage} 
            alt="Fullscreen view" 
            className="max-w-full max-h-full object-contain cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

'use client';

import { Mail, Phone, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { ContactForm } from '@/components/ContactForm';

import { useSettingsStore } from '@/store/useSettingsStore';
export const contactEmail = 'upsc@zenscroll.app';
export default function ContactPage() {
  const { language } = useSettingsStore();

  const text = {
    en: {
      title: 'Get in Touch',
      subtitle:
        "We'd love to hear from you. Whether you have a question about features, pricing, or just want to say hi, our team is ready to answer all your questions.",
      contactInfo: 'Contact Information',
      email: 'Email',
      messageTitle: 'Send us a message',
    },
    hi: {
      title: 'संपर्क करें',
      subtitle:
        "हम आपसे सुनना चाहेंगे। चाहे आपके पास किसी फीचर, शुल्क को लेकर कोई प्रश्न हो या आप बस 'नमस्ते' कहना चाहते हों, हमारी टीम आपकी सहायता के लिए तैयार है।",
      contactInfo: 'संपर्क जानकारी',
      email: 'ईमेल',
      messageTitle: 'हमें संदेश भेजें',
    },
  };

  const t = language === 'hi' ? text.hi : text.en;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-8">
          <div className="mb-16 space-y-4 text-center">
            <h1 className="font-display text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              {t.title}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-500">{t.subtitle}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              <div className="space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900">{t.contactInfo}</h3>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      window.location.href = `mailto:${contactEmail}`;
                    }}
                    className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-50 to-violet-50 p-4 border border-indigo-100 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:border-indigo-300 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#4f46e5] text-white shadow-sm transition-transform group-hover:scale-110">
                        <Mail size={20} strokeWidth={2.5} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-indigo-950 text-[17px] tracking-tight">{t.email}</p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700/80 mt-0.5">Detailed inquiries</p>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-200/50 text-indigo-700 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-[-4px]">
                      <span className="font-bold text-lg leading-none">→</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const waNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER || '917489388350';
                      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent('Hi, I need help with the UPSC App. My query is:')}`, '_blank');
                    }}
                    className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 p-4 border border-green-100 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:border-green-300 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm transition-transform group-hover:scale-110">
                        <Phone size={22} fill="currentColor" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-green-950 text-[17px] tracking-tight">WhatsApp Chat</p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-green-700/80 mt-0.5">Instant human support</p>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-200/50 text-green-700 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-[-4px]">
                      <span className="font-bold text-lg leading-none">→</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      const botUsername = process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_BOT_USERNAME || 'upsc_zenscroll_support_agent_bot';
                      window.open(`https://t.me/${botUsername}?start=general`, '_blank');
                    }}
                    className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 p-4 border border-sky-100 shadow-sm transition-all hover:scale-[1.02] hover:shadow-md hover:border-sky-300 active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0088cc] text-white shadow-sm transition-transform group-hover:scale-110 group-hover:-rotate-12">
                        <Send size={20} fill="currentColor" className="ml-[-2px] mt-[2px]" />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-sky-950 text-[17px] tracking-tight">Telegram Bot</p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700/80 mt-0.5">Automated queries</p>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-200/50 text-sky-700 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-[-4px]">
                      <span className="font-bold text-lg leading-none">→</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2"
            >
              <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-indigo-100/50 md:p-10">
                <h2 className="font-display mb-6 text-2xl font-bold">{t.messageTitle}</h2>
                <ContactForm />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

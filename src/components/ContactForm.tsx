'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { submitSupportTicket } from '@/actions/support-actions';
import { toast } from 'sonner';

export function ContactForm() {
  const [loading, setLoading] = useState(false);
  const { user, language } = useSettingsStore();

  const t = {
    en: {
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      topic: 'Topic',
      message: 'Message',
      send: 'Send Message',
      placeholderName: 'UPSC Aspirant',
      placeholderPhone: '+91...',
      placeholderEmail: 'student@upsc.com',
      placeholderTopic: 'Select a topic',
      placeholderMessage: 'How can we help you?',
      topics: {
        general: 'General Inquiry',
        technical: 'Technical Issue',
        payment: 'Payment & Subscription',
        content: 'Content Feedback',
      },
      success: "Message sent! We'll get back to you shortly.",
      error: 'Failed to send message. Please try again.',
      required: 'Required',
    },
    hi: {
      name: 'नाम',
      phone: 'फ़ोन',
      email: 'ईमेल',
      topic: 'विषय',
      message: 'संदेश',
      send: 'संदेश भेजें',
      placeholderName: 'UPSC अभ्यर्थी',
      placeholderPhone: '+91...',
      placeholderEmail: 'student@upsc.com',
      placeholderTopic: 'विषय चुनें',
      placeholderMessage: 'हम आपकी कैसे सहायता कर सकते हैं?',
      topics: {
        general: 'सामान्य पूछताछ',
        technical: 'तकनीकी समस्या',
        payment: 'भुगतान और सदस्यता',
        content: 'सामग्री (Content) प्रतिक्रिया',
      },
      success: 'संदेश भेज दिया गया! हम आपसे जल्द ही संपर्क करेंगे।',
      error: 'संदेश भेजने में विफल। कृपया पुन: प्रयास करें।',
      required: 'आवश्यक है',
    },
  };

  const text = language === 'hi' ? t.hi : t.en;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      category: 'general',
      message: '',
    },
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    const res = await submitSupportTicket({
      ...data,
      userId: user?.id,
    });
    setLoading(false);

    if (res.success) {
      toast.success(text.success);
      reset();
    } else {
      toast.error(text.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{text.name}</Label>
          <Input
            id="name"
            placeholder={text.placeholderName}
            {...register('name', { required: true })}
            defaultValue={user?.name || ''}
            className="h-12"
          />
          {errors.name && <span className="text-xs text-red-500">{text.required}</span>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{text.phone}</Label>
          <Input
            id="phone"
            placeholder={text.placeholderPhone}
            {...register('phone', { required: true, minLength: 10 })}
            className="h-12"
          />
          {errors.phone && <span className="text-xs text-red-500">{text.required}</span>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{text.email}</Label>
        <Input
          id="email"
          type="email"
          placeholder={text.placeholderEmail}
          {...register('email', { required: true })}
          defaultValue={user?.email || ''}
          className="h-12"
        />
        {errors.email && <span className="text-xs text-red-500">{text.required}</span>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{text.topic}</Label>
        <Select onValueChange={(val) => setValue('category', val)} defaultValue="general">
          <SelectTrigger className="h-12">
            <SelectValue placeholder={text.placeholderTopic} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">{text.topics.general}</SelectItem>
            <SelectItem value="technical">{text.topics.technical}</SelectItem>
            <SelectItem value="payment">{text.topics.payment}</SelectItem>
            <SelectItem value="content">{text.topics.content}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{text.message}</Label>
        <Textarea
          id="message"
          placeholder={text.placeholderMessage}
          className="min-h-[150px] resize-none"
          {...register('message', { required: true })}
        />
        {errors.message && <span className="text-xs text-red-500">{text.required}</span>}
      </div>

      <Button
        type="submit"
        className="h-12 w-full bg-slate-900 text-lg font-bold text-white hover:bg-slate-800"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : (
          <Send className="mr-2 h-5 w-5" />
        )}
        {text.send}
      </Button>
    </form>
  );
}

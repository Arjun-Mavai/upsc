'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Star, Send, ThumbsUp, ChevronLeft, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  category: z.enum(['test_series', 'content', 'bug', 'ui', 'feature_request', 'other']),
  rating: z.number().min(1).max(5),
  message: z.string().min(10, 'Please share a bit more detail (min 10 chars)'),
  role: z.string().optional(),
  location: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function FeedbackPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 5, // Default to 5 stars! Positive psychology.
      category: 'content',
    },
  });

  const rating = watch('rating');

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to submit');

      setIsSubmitted(true);
      toast.success('Feedback received!', {
        description: 'Thank you for helping us improve.',
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 pl-0 text-slate-500 hover:bg-transparent hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        <div className="mb-10 space-y-2 text-center">
          <h1 className="font-display text-3xl font-bold text-slate-900">We Value Your Feedback</h1>
          <p className="text-slate-500">
            Help us make Mindful UPSC the best preparation platform for you.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50"
        >
          {!isSubmitted ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6 sm:p-8">
              {/* Rating Section */}
              <div className="space-y-4 text-center">
                <Label className="text-lg font-semibold text-slate-700">
                  How would you rate your experience?
                </Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className="transition-transform hover:scale-110 focus:outline-none"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setValue('rating', star)}
                    >
                      <Star
                        size={32}
                        className={cn(
                          'transition-colors duration-200',
                          (hoverRating || rating) >= star
                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                            : 'fill-slate-100 text-slate-300'
                        )}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                {errors.rating && (
                  <p className="text-sm font-medium text-red-500">{errors.rating.message}</p>
                )}
              </div>

              {/* Category Selection - Lead Gen Style Cards */}
              <div className="space-y-3">
                <Label className="text-base font-semibold text-slate-700">
                  What is this regarding?
                </Label>
                <RadioGroup
                  onValueChange={(val) => setValue('category', val as any)}
                  defaultValue="content"
                  className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                >
                  {[
                    { value: 'test_series', label: 'Test Series', emoji: '📝' },
                    { value: 'content', label: 'Syllabus Understanding', emoji: '📖' },
                    { value: 'ui', label: 'App Design', emoji: '🎨' },
                    { value: 'bug', label: 'Bug Report', emoji: '🐛' },
                    { value: 'feature_request', label: 'Feature Idea', emoji: '💡' },
                    { value: 'other', label: 'Other', emoji: '💭' },
                  ].map((item) => (
                    <div key={item.value}>
                      <RadioGroupItem value={item.value} id={item.value} className="peer sr-only" />
                      <label
                        htmlFor={item.value}
                        className="flex h-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-slate-100 bg-white p-3 transition-all peer-data-[state=checked]:scale-105 peer-data-[state=checked]:border-indigo-600 peer-data-[state=checked]:bg-indigo-50 peer-data-[state=checked]:text-indigo-700 peer-data-[state=checked]:shadow-md peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-indigo-600 hover:border-slate-300 hover:bg-slate-50"
                      >
                        <span className="mb-1 text-2xl">{item.emoji}</span>
                        <span className="text-center text-xs font-bold">{item.label}</span>
                      </label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us what you think..."
                    className="min-h-[120px] resize-none text-base"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-xs font-medium text-red-500">{errors.message.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="UPSC aspirant" {...register('name')} />
                    {errors.name && (
                      <p className="text-xs font-medium text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input id="phone" type="tel" placeholder="+91..." {...register('phone')} />
                  </div>
                </div>

                {/* Role & Location */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Role (Optional)</Label>
                    <Select onValueChange={(val) => setValue('role', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aspirant">Aspirant</SelectItem>
                        <SelectItem value="Selected Officer">Selected Officer</SelectItem>
                        <SelectItem value="Teacher">Teacher</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <div className="relative">
                      <MapPin className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="location"
                        placeholder="Delhi, Mumbai..."
                        className="pl-9"
                        {...register('location')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="upsc@zenscroll.app"
                    {...register('email')}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full bg-slate-900 text-base font-bold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Feedback <Send className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-6 p-12 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
              >
                <ThumbsUp className="h-10 w-10 text-green-600" />
              </motion.div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
                <p className="text-slate-500">Your feedback has been submitted successfully.</p>
              </div>
              <div className="mt-8 flex justify-center gap-4">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Submit Another
                </Button>
                <Button
                  asChild
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 sm:w-auto"
                >
                  <a href="/">Back to Home</a>
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

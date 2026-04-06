'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { uploadBlog } from '@/actions/blog-actions';
import { uploadTestFromJSON, getExistingTests } from '@/actions/admin-actions';
import { toast } from 'sonner';
import {
  Loader2,
  FileJson,
  Upload,
  BookOpen,
  Video,
  FileText,
  CheckCircle2,
  Plus,
  Database,
} from 'lucide-react';
import { syllabusData } from '@/data/syllabusData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logger } from '@/lib/logger';

const UNITS = Array.from({ length: 10 }, (_, i) => `unit_${i + 1}`);

const BLOG_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'polity', label: 'Polity' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'current_affairs_mp', label: 'MP Current Affairs' },
  { value: 'economics', label: 'Economics' },
  { value: 'science', label: 'Science & Tech' },
  { value: 'mp_gk', label: 'Madhya Pradesh GK' },
  { value: 'mp_polity', label: 'Madhya Pradesh Polity' },
  { value: 'mp_current_affairs', label: 'Madhya Pradesh Current Affairs' },
];

export default function AdminUploadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('blog');

  // Blog State
  const [blogData, setBlogData] = useState({
    imageUrl: '',
    contentJson: '',
  });

  // Test State
  const [testMode, setTestMode] = useState<'new' | 'existing'>('new');
  const [existingTests, setExistingTests] = useState<
    { id: string; title: string; type: string; totalQuestions: number }[]
  >([]);
  const [topicLang, setTopicLang] = useState<'hi' | 'en'>('hi'); // Language toggle for topics

  const [testData, setTestData] = useState({
    type: 'TOPIC', // FLT | UNIT | TOPIC | CSAT | MISC
    title: '',
    unitId: 'unit_1',
    topicId: '', // For Topic Tests
    subjectTag: '', // MISC type ke liye subject tag
    description: '',
    existingTestId: '',
    questionsJson: '',
  });

  useEffect(() => {
    // Fetch existing tests on mount
    getExistingTests().then(setExistingTests);
  }, []);

  // Derived: Get Topics for selected Unit
  const availableTopics = useMemo(() => {
    if (!testData.unitId) return [];
    // @ts-ignore
    const unit = syllabusData.units[testData.unitId];
    // Handle language structure differences
    if (topicLang === 'hi') {
      return unit?.topics || [];
    } else {
      return unit?.topics_en || unit?.topics || [];
    }
  }, [testData.unitId, topicLang]);

  const handleBlogChange = (e: any) => {
    const { name, value } = e.target;
    setBlogData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestChange = (e: any) => {
    const { name, value } = e.target;
    setTestData((prev) => ({ ...prev, [name]: value }));
  };

  // --- SUBMIT BLOG ---
  const handleBlogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Validate JSON structure
      let parsed = JSON.parse(blogData.contentJson);

      // If AI returns an array, take the first element
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          toast.error('JSON array is empty. Please provide valid content.');
          setIsLoading(false);
          return;
        }
        parsed = parsed[0]; // Take first element
      }

      if (!parsed.metadata || !parsed.content) {
        toast.error("Invalid JSON: Must contain 'metadata' and 'content' keys.");
        setIsLoading(false);
        return;
      }

      const { metadata, content } = parsed;

      // Validate metadata fields
      if (!metadata.title || !metadata.slug || !metadata.category) {
        toast.error('Missing required metadata: title, slug, or category.');
        setIsLoading(false);
        return;
      }

      // Validate content structure
      if (!content.hi || !content.en) {
        toast.error("Content must have both 'hi' and 'en' keys.");
        setIsLoading(false);
        return;
      }

      const res = await uploadBlog({
        imageUrl: blogData.imageUrl,
        contentJson: JSON.stringify(parsed), // Pass the extracted object
      });

      if (res.success) {
        toast.success(`${metadata.type === 'vlog' ? 'Vlog' : 'Blog'} uploaded successfully!`);
        setBlogData({
          imageUrl: '',
          contentJson: '',
        });
      } else {
        toast.error(res.error || 'Upload failed');
      }
    } catch (err) {
      logger.error('Blog Upload Failed:', err);
      toast.error('Invalid JSON format. Please check the structure.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUBMIT TEST ---
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate JSON first
      JSON.parse(testData.questionsJson);

      const formData = new FormData();
      formData.append('mode', testMode);
      formData.append('jsonData', testData.questionsJson);

      if (testMode === 'new') {
        let finalTitle = testData.title;
        // Auto-generate title if Topic Test
        if (testData.type === 'TOPIC' && testData.topicId) {
          const topic = availableTopics.find((t: any) => t.id.toString() === testData.topicId);
          if (topic && !finalTitle) {
            finalTitle = `Quick Check: ${topic.front}`;
          }
        }

        formData.append('title', finalTitle);
        formData.append('type', testData.type);
        formData.append('unitId', testData.unitId);
        formData.append('topicId', testData.topicId); // Pass topicId
        // MISC type ke liye subject tag bhi bhejo
        if (testData.type === 'MISC' && testData.subjectTag) {
          formData.append('subjectTag', testData.subjectTag);
        }
      } else {
        formData.append('existingTestId', testData.existingTestId);
      }

      const res = await uploadTestFromJSON(null, formData);

      if (res.success) {
        toast.success(res.message);
        setTestData((prev) => ({ ...prev, questionsJson: '', title: '' }));
        // Refresh existing tests
        getExistingTests().then(setExistingTests);
      } else {
        toast.error(res.message || 'Upload failed');
      }
    } catch (err: any) {
      toast.error('Invalid JSON Questions: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-12">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Admin Upload Center
            </h1>
            <p className="text-slate-500">Manage content, quizzes, and learning resources.</p>
          </div>
        </div>

        <Tabs
          defaultValue="blog"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid h-12 w-full grid-cols-2 border bg-white p-1 shadow-sm md:w-[400px]">
            <TabsTrigger
              value="blog"
              className="h-full text-base data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
            >
              <FileText className="mr-2 h-4 w-4" /> Content (Blog/Vlog)
            </TabsTrigger>
            <TabsTrigger
              value="test"
              className="h-full text-base data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Tests & Quizzes
            </TabsTrigger>
          </TabsList>

          {/* === BLOG / VLOG TAB === */}
          <TabsContent value="blog">
            <Card className="border-indigo-100 shadow-md">
              <CardHeader className="border-b border-indigo-50/50 bg-gradient-to-r from-indigo-50 to-white">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <BookOpen className="h-5 w-5 text-indigo-600" />
                  Blog & Vlog Upload
                </CardTitle>
                <CardDescription>Create rich articles or video lessons.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleBlogSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Image URL (Optional)</Label>
                    <Input
                      name="imageUrl"
                      value={blogData.imageUrl}
                      onChange={handleBlogChange}
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-xs text-slate-400">Cover image for the blog post</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex justify-between">
                      <span>AI-Generated JSON (with Metadata + Content)</span>
                      <div className="flex gap-2">
                        <span className="text-xs font-normal text-slate-400">
                          Format: <code>{`{ "metadata": {...}, "content": {...} }`}</code>
                        </span>
                        <a
                          href="/prompts/blog_generation.md"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-indigo-500 hover:underline"
                        >
                          View Prompt
                        </a>
                      </div>
                    </Label>
                    <Textarea
                      name="contentJson"
                      value={blogData.contentJson}
                      onChange={handleBlogChange}
                      className="h-[400px] bg-slate-50 font-mono text-xs"
                      placeholder='{ "metadata": { "title": "...", "slug": "...", "description": "...", "category": "...", "readingTime": 5, "type": "blog" }, "content": { "hi": [...], "en": [...] } }'
                      required
                    />
                    <p className="text-[10px] text-slate-400">
                      Paste the complete JSON response from the AI generator. It should include both
                      metadata and bilingual content.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload Blog
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TEST UPLOAD TAB === */}
          <TabsContent value="test">
            <Card className="border-emerald-100 shadow-md">
              <CardHeader className="border-b border-emerald-50/50 bg-gradient-to-r from-emerald-50 to-white">
                <CardTitle className="flex items-center gap-2 text-emerald-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Test & Quiz Upload
                </CardTitle>
                <CardDescription>
                  Create new assessments or append questions to existing ones.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleTestSubmit} className="space-y-6">
                  {/* Mode Toggle */}
                  <RadioGroup
                    value={testMode}
                    onValueChange={(v) => setTestMode(v as 'new' | 'existing')}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div
                      className={`flex cursor-pointer items-center space-x-2 rounded-xl border p-4 transition-all ${testMode === 'new' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <RadioGroupItem value="new" id="new" className="text-emerald-600" />
                      <Label
                        htmlFor="new"
                        className="flex cursor-pointer items-center gap-2 font-bold"
                      >
                        <Plus className="h-4 w-4" /> Create New Test
                      </Label>
                    </div>
                    <div
                      className={`flex cursor-pointer items-center space-x-2 rounded-xl border p-4 transition-all ${testMode === 'existing' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}
                    >
                      <RadioGroupItem value="existing" id="existing" className="text-emerald-600" />
                      <Label
                        htmlFor="existing"
                        className="flex cursor-pointer items-center gap-2 font-bold"
                      >
                        <Database className="h-4 w-4" /> Add to Existing
                      </Label>
                    </div>
                  </RadioGroup>

                  {testMode === 'new' ? (
                    <>
                      {/* Test Type Selection */}
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                        <Label className="mb-2 block text-emerald-800">Test Type</Label>
                        <div className="flex flex-wrap gap-2">
                          {['TOPIC', 'UNIT', 'FLT', 'CSAT', 'PYQ', 'MISC', 'UPSC_PYQ', 'UPSC_FLT'].map((type) => (
                            <div
                              key={type}
                              onClick={() => setTestData((p) => ({ ...p, type }))}
                              className={`cursor-pointer rounded-md border px-4 py-2 text-sm font-medium transition-all ${
                                testData.type === type
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                  : 'border-emerald-200 bg-white text-emerald-900 hover:border-emerald-400'
                              } `}
                            >
                              {type === 'TOPIC' ? 'Topic Check' : type === 'MISC' ? 'Free Quiz' : type.replace('_', ' ')}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Dynamic Fields based on Type */}
                        {(testData.type === 'TOPIC' || testData.type === 'UNIT' || testData.type === 'MISC') && (
                          <div className="space-y-2">
                            <Label>Select Unit</Label>
                            <Select
                              value={testData.unitId}
                              onValueChange={(v) =>
                                setTestData((p) => ({ ...p, unitId: v, topicId: '' }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {UNITS.map((u) => (
                                  <SelectItem key={u} value={u}>
                                    Unit {u.split('_')[1]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {testData.type === 'TOPIC' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>Select Topic (from Syllabus)</Label>
                              <div className="flex rounded-md bg-slate-100 p-1">
                                <button
                                  type="button"
                                  onClick={() => setTopicLang('hi')}
                                  className={`rounded px-2 py-0.5 text-xs transition-all ${topicLang === 'hi' ? 'bg-white font-bold text-indigo-600 shadow' : 'text-slate-500'}`}
                                >
                                  हिंदी
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTopicLang('en')}
                                  className={`rounded px-2 py-0.5 text-xs transition-all ${topicLang === 'en' ? 'bg-white font-bold text-indigo-600 shadow' : 'text-slate-500'}`}
                                >
                                  EN
                                </button>
                              </div>
                            </div>
                            <Select
                              value={testData.topicId}
                              onValueChange={(v) => setTestData((p) => ({ ...p, topicId: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a topic..." />
                              </SelectTrigger>
                              <SelectContent>
                                <ScrollArea className="h-64">
                                  {availableTopics.map((t: any) => (
                                    <SelectItem key={t.id} value={t.id.toString()}>
                                      {t.front.substring(0, 40)}...
                                    </SelectItem>
                                  ))}
                                </ScrollArea>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {testData.type === 'MISC' && (
                          <div className="space-y-2">
                            <Label>Subject Tag (Filter me dikhega)</Label>
                            <Select
                              value={testData.subjectTag}
                              onValueChange={(v) => setTestData((p) => ({ ...p, subjectTag: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Subject choose karo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  'History', 'MP Culture', 'Geography', 'MP Geography',
                                  'Polity', 'Economy', 'Science', 'Current Affairs',
                                  'ICT', 'MP Tribes',
                                ].map((s) => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            name="title"
                            value={testData.title}
                            onChange={handleTestChange}
                            placeholder={
                              testData.type === 'TOPIC' ? 'Auto-generated if empty' : 'Test Title'
                            }
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Label>Select Existing Test</Label>
                      <Select
                        value={testData.existingTestId}
                        onValueChange={(v) => setTestData((p) => ({ ...p, existingTestId: v }))}
                      >
                        <SelectTrigger className="h-12 bg-white">
                          <SelectValue placeholder="Search or select a test..." />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[300px]">
                            {existingTests.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No tests found
                              </SelectItem>
                            ) : (
                              existingTests.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  <span className="font-medium">{t.title}</span>
                                  <span className="ml-2 text-xs text-slate-400">
                                    ({t.type} • {t.totalQuestions} Qs)
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="flex justify-between">
                      <span>Questions JSON Array</span>
                      <div className="flex gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-normal text-slate-400">
                            Format:{' '}
                            <code>
                              [{`{ "questionText": "...", "extendedData": {}, "options": ["A","B"], "correctAnswer": "A" }`}
                              ]
                            </code>
                          </span>
                          <span className="text-[10px] text-emerald-500 font-medium">✨ Supports "extendedData" for complex UPSC Numbered/Table questions</span>
                        </div>
                        {testData.type === 'MISC' && (
                          <a
                            href="/prompts/free_quiz_generation.md"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-emerald-500 hover:underline"
                          >
                            View Prompt
                          </a>
                        )}
                      </div>
                    </Label>
                    <Textarea
                      name="questionsJson"
                      value={testData.questionsJson}
                      onChange={handleTestChange}
                      className="h-[300px] bg-emerald-50/30 font-mono text-xs font-medium text-slate-700"
                      placeholder='[{ "questionText": "Standard Question", "extendedData": { "layoutType": "table", ... }, "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "..." }]'
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full bg-emerald-600 text-base font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 animate-spin" />
                    ) : testMode === 'new' ? (
                      <>
                        <Upload className="mr-2 h-4 w-4" /> Create & Upload Test
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" /> Append to Test
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

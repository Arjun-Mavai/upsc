'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function SearchInput({ value, onChange, className, placeholder }: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search articles..."}
        className="border-slate-200 bg-slate-50 pl-9 transition-colors focus:bg-white"
      />
    </div>
  );
}

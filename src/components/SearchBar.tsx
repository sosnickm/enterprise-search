import { Search } from "lucide-react";
import { Input } from "./ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isScrolled?: boolean;
}

export function SearchBar({ value, onChange, placeholder = "Search research...", isScrolled = false }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5 z-10" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`pl-12 bg-input-background border border-border rounded shadow-sm hover:border-border focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 text-base font-medium placeholder:font-normal placeholder:text-muted-foreground ${isScrolled ? 'h-10' : 'h-12'}`}
      />
    </div>
  );
}
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  description: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search campaigns..."
              className="pl-10 w-64"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          
          {/* Notifications */}
          <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

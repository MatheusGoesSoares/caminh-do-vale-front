import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div
      className={cn("flex gap-1 border-b border-[#E6F4EA]", className)}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F8A4D] focus-visible:ring-offset-2 rounded-t-lg",
              isActive
                ? "text-[#1A7A44]"
                : "text-[#5B7264] hover:text-[#123A24] hover:bg-[#F4FAF5]"
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A7A44] rounded-full motion-reduce:transition-none" />
            )}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
  if (id !== activeTab) return null;
  return (
    <div
      id={`tabpanel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      className={cn("pt-4", className)}
    >
      {children}
    </div>
  );
}

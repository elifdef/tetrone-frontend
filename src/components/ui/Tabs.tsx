import type { ReactNode } from 'react';

export interface TabItem<T extends string = string> {
    id: T;
    label: ReactNode;
}

export interface TabsProps<T extends string = string> {
    tabs: readonly TabItem<T>[];
    activeTab: T;
    onChange: (tabId: T) => void;
    rightElement?: ReactNode;
    className?: string;
}

export default function Tabs<T extends string = string>({
    tabs,
    activeTab,
    onChange,
    rightElement,
    className = '',
}: TabsProps<T>) {
    return (
        <div className={`flex justify-between items-center gap-[5px] mb-[15px] pb-[5px] border-b border-border flex-wrap ${className}`}>
            <div className="flex gap-[5px] flex-wrap items-center">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`px-[10px] py-[4px] text-[11px] font-bold cursor-pointer outline-none transition-colors border-none ${
                                isActive
                                    ? 'bg-theme-brand text-white'
                                    : 'bg-transparent text-theme-link hover:bg-theme-brand hover:text-white'
                            }`}
                            onClick={() => onChange(tab.id)}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {rightElement && (
                <div className="flex items-center ml-auto">
                    {rightElement}
                </div>
            )}
        </div>
    );
}
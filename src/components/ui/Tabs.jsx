import React from 'react';

export default function Tabs({ tabs, activeTab, onChange, rightElement, className = "" }) {
    return (
        <div className={`flex justify-between items-center gap-[5px] mb-[15px] pb-[5px] border-b border-border flex-wrap ${className}`}>

            <div className="flex gap-[5px] flex-wrap items-center">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
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
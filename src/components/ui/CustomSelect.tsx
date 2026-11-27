import {
    useState,
    useRef,
    useEffect,
    useMemo,
    isValidElement,
    type ReactNode,
    type KeyboardEvent,
} from 'react';
import { useTranslation } from 'react-i18next';

export interface CustomSelectOption<T extends string | number = string> {
    value: T;
    label: ReactNode;
    group?: string;
    keywords?: string;
    disabled?: boolean;
}

export interface CustomSelectProps<T extends string | number = string> {
    options: readonly CustomSelectOption<T>[];
    value?: T | null;
    onChange: (value: T) => void;
    placeholder?: string;
    className?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    emptyText?: string;
}

function extractNodeText(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(extractNodeText).join(' ');
    }
    if (isValidElement<{ children?: ReactNode }>(node)) {
        return extractNodeText(node.props.children);
    }
    return '';
}

export default function CustomSelect<T extends string | number = string>({
    options,
    value,
    onChange,
    placeholder,
    className = '',
    searchable = false,
    searchPlaceholder,
    emptyText,
}: CustomSelectProps<T>) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchable) {
            searchInputRef.current?.focus();
        }
    }, [isOpen, searchable]);

    const selectedOption = useMemo(
        () => options.find((opt) => String(opt.value) === String(value)),
        [options, value]
    );

    const filteredOptions = useMemo(() => {
        if (!searchable) return options;

        const query = searchQuery.trim().toLowerCase();
        if (!query) return options;

        return options.filter((opt) => {
            if (String(opt.value) === '') return false;
            const searchableText = (opt.keywords ?? extractNodeText(opt.label)).toLowerCase();
            return searchableText.includes(query);
        });
    }, [options, searchable, searchQuery]);

    const handleToggle = () => {
        setIsOpen((prev) => {
            const next = !prev;
            if (!next) {
                setSearchQuery('');
            }
            return next;
        });
    };

    const handleSelect = (val: T) => {
        onChange(val);
        setIsOpen(false);
        setSearchQuery('');
    };

    const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchQuery('');
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            const firstAvailable = filteredOptions.find((opt) => !opt.disabled);
            if (firstAvailable) {
                handleSelect(firstAvailable.value);
            }
        }
    };

    const isPlaceholderState = !selectedOption || selectedOption.value === '';

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`flex items-center gap-[8px] bg-input-bg border h-[28px] px-[8px] box-border cursor-pointer select-none w-full overflow-hidden transition-colors ${
                    isOpen
                        ? 'border-input-border !border-b-transparent'
                        : 'border-input-border hover:border-theme-link'
                }`}
                onClick={handleToggle}
            >
                <span
                    className={`whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-[11px] ${
                        isPlaceholderState ? 'text-text-muted' : 'text-text-main'
                    }`}
                >
                    {selectedOption ? selectedOption.label : placeholder}
                </span>

                <span className="ml-auto text-[9px] text-text-muted flex-shrink-0">
                    {isOpen ? '▲' : '▼'}
                </span>
            </div>

            {isOpen && (
                <div className="absolute top-[100%] left-0 right-0 bg-input-bg border border-border border-t-0 z-[1000] shadow-[2px_2px_4px_rgba(0,0,0,0.2)]">
                    {searchable && (
                        <div
                            className="p-[6px] border-b border-border bg-bg-box"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={searchPlaceholder ?? t('action.search')}
                                className="w-full h-[24px] px-[6px] bg-input-bg border border-input-border text-text-main text-[11px] font-tahoma outline-none focus:border-theme-link box-border"
                            />
                        </div>
                    )}

                    <ul className="max-h-[200px] overflow-y-auto m-0 p-0 list-none">
                        {filteredOptions.length === 0 ? (
                            <li className="p-[8px] text-center text-text-muted text-[11px]">
                                {emptyText ?? t('empty.search_results')}
                            </li>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const prevGroup = idx > 0 ? filteredOptions[idx - 1].group : undefined;
                                const showGroupHeader = Boolean(opt.group && opt.group !== prevGroup);

                                return (
                                    <li key={String(opt.value)} className="border-b border-border last:border-b-0">
                                        {showGroupHeader && (
                                            <div className="bg-bg-box text-theme-link text-[9px] font-bold uppercase p-[4px_8px] cursor-default border-b border-border">
                                                {opt.group}
                                            </div>
                                        )}

                                        <div
                                            onClick={() => !opt.disabled && handleSelect(opt.value)}
                                            className={`flex items-center gap-[8px] p-[6px_8px] cursor-pointer text-[11px] transition-colors ${
                                                String(value) === String(opt.value)
                                                    ? 'bg-bg-page font-bold text-text-main'
                                                    : 'text-text-main hover:bg-bg-hover'
                                            }`}
                                        >
                                            <span className="whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                                {opt.label}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
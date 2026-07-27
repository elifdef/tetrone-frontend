import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Іконка лупи
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export default function StickerSearchBar({ initialValue = '', onSearch }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState(initialValue);

    // Синхронізуємо локальний стейт, якщо URL раптом змінився ззовні
    useEffect(() => {
        setQuery(initialValue);
    }, [initialValue]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query.trim()); // Передаємо текст наверх при натисканні Enter
    };

    return (
        <form className="tetrone-sticker-search-form" onSubmit={handleSubmit}>
            <div className="tetrone-sticker-search-wrapper">
                <div className="tetrone-sticker-search-icon">
                    <SearchIcon />
                </div>
                <input
                    type="text"
                    className="tetrone-form-input tetrone-sticker-search-input"
                    placeholder={t('stickers.search_placeholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>
        </form>
    );
}
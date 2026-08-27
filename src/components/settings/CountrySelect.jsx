import {useState, useMemo, useRef, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import isoCountries from "i18n-iso-countries";
import {countries as continentsData, continents} from 'countries-list';
import "flag-icons/css/flag-icons.min.css";

const continentM49 = {
    'AF': '002', // Африка
    'AN': 'AQ',  // Антарктика
    'AS': '142', // Азія
    'EU': '150', // Європа
    'NA': '021', // Північна Америка
    'OC': '009', // Океанія
    'SA': '005'  // Південна Америка
};

const CountrySelect = ({value, onChange}) => {
    const {t, i18n} = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const {groupedCountries, selectedCountry} = useMemo(() => {
        const langCode = i18n.language;

        let regionNames;
        try {
            regionNames = new Intl.DisplayNames([langCode], {type: 'region'});
        } catch (e) {
            regionNames = null;
        }

        const countriesObj = isoCountries.getNames(langCode, {select: "official"})
            || isoCountries.getNames('en', {select: "official"});

        const allCountries = Object.entries(countriesObj).map(([code, name]) => {
            const continentCode = continentsData[code]?.continent;
            let continentName = continentCode ? continents[continentCode] : 'Other';

            if (regionNames && continentCode && continentM49[continentCode]) {
                try {
                    continentName = regionNames.of(continentM49[continentCode]);
                } catch (e) {}
            }

            return {code, name, continentName};
        });

        const selected = allCountries.find(c => c.code === value);

        const grouped = allCountries.reduce((acc, country) => {
            const groupName = country.continentName;
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(country);
            return acc;
        }, {});

        Object.keys(grouped).forEach(continent => {
            grouped[continent].sort((a, b) => a.name.localeCompare(b.name));
        });

        const sortedGrouped = Object.keys(grouped)
        .sort((a, b) => a.localeCompare(b))
        .reduce((acc, key) => {
            acc[key] = grouped[key];
            return acc;
        }, {});

        return {groupedCountries: sortedGrouped, selectedCountry: selected};
    }, [i18n.language, value]);

    const handleSelect = (code) => {
        onChange({
            target: { name: 'country', value: code }
        });
        setIsOpen(false);
    };

    return (
        <div className="mb-[12px] relative w-full" ref={dropdownRef}>
            <label className="block mb-[4px] text-text-muted font-normal text-[11px]">{t('common.country')}</label>

            <div className="relative w-full">
                <div
                    className={`flex items-center gap-[8px] bg-input-bg border h-[28px] px-[8px] box-border cursor-pointer select-none w-full overflow-hidden transition-colors ${isOpen ? 'border-input-border !border-b-transparent' : 'border-input-border hover:border-theme-link'}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {selectedCountry ? (
                        <>
                            <span className={`fi fi-${selectedCountry.code.toLowerCase()} flex-shrink-0`}></span>
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-text-main text-[11px]">{selectedCountry.name}</span>
                        </>
                    ) : (
                        <span className="text-text-muted whitespace-nowrap overflow-hidden text-ellipsis flex-1 text-[11px]">{t('settings.not_selected')}</span>
                    )}

                    <span className="ml-auto text-[9px] text-text-muted flex-shrink-0">
                        {isOpen ? '▲' : '▼'}
                    </span>
                </div>

                {isOpen && (
                    <ul className="absolute top-[100%] left-0 right-0 max-h-[200px] overflow-y-auto bg-input-bg border border-border border-t-0 z-[1000] m-0 p-0 list-none shadow-[2px_2px_4px_rgba(0,0,0,0.2)]">
                        <li
                            onClick={() => handleSelect(null)}
                            className="flex items-center gap-[8px] p-[6px_8px] cursor-pointer text-text-main border-b border-border last:border-b-0 hover:bg-bg-hover text-[11px]"
                        >
                            {t('settings.not_selected')}
                        </li>

                        {Object.entries(groupedCountries).map(([continent, countriesList]) => (
                            <div key={continent}>
                                <li className="bg-bg-box text-theme-link text-[9px] font-bold uppercase p-[4px_8px] cursor-default border-y border-border mt-[4px]">
                                    {continent}
                                </li>

                                {countriesList.map((c) => (
                                    <li
                                        key={c.code}
                                        onClick={() => handleSelect(c.code)}
                                        className={`flex items-center gap-[8px] p-[6px_8px] cursor-pointer text-[11px] border-b border-border last:border-b-0 transition-colors ${value === c.code ? 'bg-bg-page font-bold text-text-main' : 'text-text-main hover:bg-bg-hover'}`}
                                    >
                                        <span className={`fi fi-${c.code.toLowerCase()} flex-shrink-0`}></span>
                                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{c.name}</span>
                                    </li>
                                ))}
                            </div>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default CountrySelect;
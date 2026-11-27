import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import isoCountries from 'i18n-iso-countries';
import isoUk from 'i18n-iso-countries/langs/uk.json';
import isoEn from 'i18n-iso-countries/langs/en.json';
import { countries as continentsData, continents } from 'countries-list';
import CustomSelect, { type CustomSelectOption } from '@/components/ui/CustomSelect';
import 'flag-icons/css/flag-icons.min.css';

isoCountries.registerLocale(isoUk);
isoCountries.registerLocale(isoEn);

const continentM49: Record<string, string> = {
    AF: '002',
    AN: 'AQ',
    AS: '142',
    EU: '150',
    NA: '021',
    OC: '009',
    SA: '005',
};

interface CountryItem {
    code: string;
    name: string;
    continentName: string;
    keywords: string;
}

export interface CountrySelectProps {
    name?: string;
    value: string;
    onChange: (event: { target: { name: 'country'; value: string } }) => void;
}

const CountrySelect = ({ value, onChange }: CountrySelectProps) => {
    const { t, i18n } = useTranslation();

    const options = useMemo<CustomSelectOption<string>[]>(() => {
        const rawLang = i18n.resolvedLanguage || i18n.language || 'uk';
        const langCode = rawLang.split('-')[0].toLowerCase();

        let regionNames: Intl.DisplayNames | null;
        try {
            regionNames = new Intl.DisplayNames([langCode], { type: 'region' });
        } catch {
            regionNames = null;
        }

        const localizedMap = isoCountries.getNames(langCode, { select: 'official' });
        const englishMap = isoCountries.getNames('en', { select: 'official' });
        const countriesObj =
            localizedMap && Object.keys(localizedMap).length > 0 ? localizedMap : englishMap;

        const allCountries: CountryItem[] = Object.entries(countriesObj).map(([code, rawName]) => {
            const name = Array.isArray(rawName) ? rawName[0] : rawName;
            const rawEnName = englishMap[code];
            const enName = Array.isArray(rawEnName) ? rawEnName[0] : rawEnName || '';

            const continentCode =
                (continentsData as Record<string, { continent?: string }>)[code]?.continent;
            let continentName = continentCode
                ? (continents as Record<string, string>)[continentCode] || 'Other'
                : 'Other';

            if (regionNames && continentCode && continentM49[continentCode]) {
                try {
                    continentName = regionNames.of(continentM49[continentCode]) || continentName;
                } catch {
                    // fallback to English continent name
                }
            }

            return {
                code,
                name,
                continentName,
                keywords: `${name} ${enName} ${code}`,
            };
        });

        const grouped = allCountries.reduce<Record<string, CountryItem[]>>((acc, country) => {
            if (!acc[country.continentName]) {
                acc[country.continentName] = [];
            }
            acc[country.continentName].push(country);
            return acc;
        }, {});

        const sortedContinents = Object.keys(grouped).sort((a, b) => a.localeCompare(b, langCode));

        const items: CustomSelectOption<string>[] = [
            {
                value: '',
                label: t('settings.not_selected'),
                keywords: t('settings.not_selected'),
            },
        ];

        for (const continent of sortedContinents) {
            const sortedCountries = [...grouped[continent]].sort((a, b) =>
                a.name.localeCompare(b.name, langCode)
            );

            for (const c of sortedCountries) {
                items.push({
                    value: c.code,
                    group: continent,
                    keywords: c.keywords,
                    label: (
                        <span className="flex items-center gap-[8px] min-w-0">
                            <span className={`fi fi-${c.code.toLowerCase()} flex-shrink-0`} />
                            <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                                {c.name}
                            </span>
                        </span>
                    ),
                });
            }
        }

        return items;
    }, [i18n.language, i18n.resolvedLanguage, t]);

    return (
        <div className="mb-[12px] relative w-full">
            <label className="block mb-[4px] text-text-muted font-normal text-[11px]">
                {t('common.country')}
            </label>

            <CustomSelect<string>
                options={options}
                value={value}
                onChange={(selectedCode) =>
                    onChange({
                        target: { name: 'country', value: selectedCode },
                    })
                }
                placeholder={t('settings.not_selected')}
                searchable
                searchPlaceholder={t('action.search')}
                emptyText={t('empty.search_results')}
                className="w-full"
            />
        </div>
    );
};

export default CountrySelect;
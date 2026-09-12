import {useTranslation} from 'react-i18next';
import InfiniteScrollList from '../common/InfiniteScrollList';
import PackCard from './PackCard';

export default function CatalogTab({packs, isLoading, page, hasMore, onLoadMore, onSelectPack})
{
    const {t} = useTranslation();

    return (
        <InfiniteScrollList
            itemsCount={packs.length}
            isLoadingInitial={isLoading && page === 1}
            isLoadingMore={isLoading && page > 1}
            hasMore={hasMore}
            onLoadMore={onLoadMore}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[15px]"
        >
            {packs.map(pack => (
                <PackCard key={pack.id} pack={pack} onClick={onSelectPack}/>
            ))}
        </InfiniteScrollList>
    );
}
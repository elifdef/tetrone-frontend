import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import FriendCard from "../components/friends/FriendCard";
import Tabs from "../components/ui/Tabs";
import { useFriendsLogic } from "../components/friends/hooks/useFriendsLogic";

export default function FriendsPage() {
    const {
        tabs, activeTab, handleTabChange,
        searchQuery, setSearchQuery, handleSearchSubmit,
        users, loading, handleAction, t
    } = useFriendsLogic();

    const displayUsers = activeTab === 'all'
        ? users
        : users.filter(u =>
            (u.first_name + " " + u.last_name).toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="w-full max-w-[800px] mx-auto box-border p-[20px] bg-bg-page border border-border text-[11px] text-text-main max-md:p-[10px]">

            <h1 className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border max-md:-mt-[10px] max-md:-mx-[10px]">
                {t('friends.your_contacts')}
            </h1>

            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onChange={handleTabChange}
            />

            <div className="flex items-center gap-[10px] mb-[15px]">
                <div className="flex-1">
                    <Input
                        placeholder={activeTab === 'all' ? t('friends.search_people') : t('friends.list_filter')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && activeTab === 'all' && handleSearchSubmit()}
                    />
                </div>
                {activeTab === 'all' && (
                    <Button onClick={handleSearchSubmit}>
                        {t('action.find')}
                    </Button>
                )}
            </div>

            <div className="flex flex-col">
                {loading ? (
                    <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">
                        {t('common.loading')}
                    </div>
                ) : (
                    <>
                        {displayUsers.length === 0 && (
                            <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">
                                {t('empty.list')}
                            </div>
                        )}

                        <div className="flex flex-col bg-bg-box">
                            {displayUsers.map(user => (
                                <FriendCard
                                    key={user.username} // ФІКС: Тепер використовуємо username
                                    user={user}
                                    viewMode={activeTab}
                                    onAction={handleAction}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
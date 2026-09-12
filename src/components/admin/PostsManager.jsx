import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AdminService from '../../services/admin.service';
import PostService from '../../services/post.service';
import { notifySuccess, notifyError } from "../common/Notify";
import { useModal } from '../../context/ModalContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import CustomSelect from '../ui/CustomSelect';
import DateInput from '../ui/DateInput';
import InfiniteScrollList from '../common/InfiniteScrollList';
import PostItem from '../post/PostItem';
import EditPostModal from '../modals/EditPostModal';
import { VerifiedIcon, CloseIcon, EditIcon, DeleteIcon } from '../ui/Icons';
import { userRole } from '../../config';

export const PostsManager = ({ currentUser }) => {
    const { t } = useTranslation();
    const { openPrompt } = useModal();

    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState(null);

    const [targetUser, setTargetUser] = useState('');
    const [isCheckedFilter, setIsCheckedFilter] = useState('false');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [editingPostId, setEditingPostId] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const isAdmin = currentUser?.role >= userRole.Admin;

    const fetchPostsAndStats = useCallback((username = '', pageNum = 1, append = false, isChecked = 'all', dFrom = '', dTo = '') => {
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);

        if (!append) {
            AdminService.getPostStats(username, dFrom, dTo)
            .onSuccess(res => setStats(res.stats))
            .onError(() => setStats(null));
        }

        AdminService.getUserPosts(username, pageNum, isChecked, dFrom, dTo)
        .onSuccess((res) => {
            const items = res.posts || [];
            const meta = res.meta;

            if (append) {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    return [...prev, ...items.filter(p => !existingIds.has(p.id))];
                });
            } else {
                setPosts(items);
            }
            setHasMore(meta ? meta.current_page < meta.last_page : false);
        })
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)))
        .onFinally(() => {
            if (append) setIsLoadingMore(false);
            else setIsLoading(false);
        });
    }, [t]);

    useEffect(() => {
        fetchPostsAndStats('', 1, false, isCheckedFilter, dateFrom, dateTo);
    }, [fetchPostsAndStats, isCheckedFilter, dateFrom, dateTo]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchPostsAndStats(targetUser, 1, false, isCheckedFilter, dateFrom, dateTo);
    };

    const loadMore = () => {
        if (!isLoadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPostsAndStats(targetUser, nextPage, true, isCheckedFilter, dateFrom, dateTo);
        }
    };

    const handleDelete = async (postId) => {
        const reason = await openPrompt(t('admin.posts.delete_reason'), "", t('action.delete'), t('action.cancel'));
        if (reason === null) return;

        PostService.delete(postId, { reason })
        .onSuccess((res) => {
            setPosts(prev => prev.filter(post => post.id !== postId));
            notifySuccess(t(`api.success.${res.code || 'POST_DELETED'}`));
            AdminService.getPostStats(targetUser, dateFrom, dateTo).onSuccess(statRes => setStats(statRes.stats));
        })
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)));
    };

    const handleToggleCheck = (postId) => {
        AdminService.togglePostCheck(postId)
        .onSuccess((res) => {
            const newStatus = res.is_checked;

            if ((isCheckedFilter === 'true' && !newStatus) || (isCheckedFilter === 'false' && newStatus)) {
                setPosts(prev => prev.filter(post => post.id !== postId));
            } else {
                setPosts(prev => prev.map(post => post.id === postId ? { ...post, is_checked: newStatus } : post));
            }

            notifySuccess(t('common.success'));
            AdminService.getPostStats(targetUser, dateFrom, dateTo).onSuccess(statRes => setStats(statRes.stats));
        })
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)));
    };

    const startEditing = (post) => setEditingPostId(post.id);
    const cancelEditing = () => setEditingPostId(null);
    const saveEdit = () => {
        setEditingPostId(null);
        fetchPostsAndStats(targetUser, page, false, isCheckedFilter, dateFrom, dateTo);
    };

    const checkOptions = [
        { value: 'false', label: t('admin.posts.filter_unchecked') },
        { value: 'all', label: t('admin.posts.filter_all') },
        { value: 'true', label: t('admin.posts.filter_checked') },
    ];

    const editingPost = posts.find(p => p.id === editingPostId);

    return (
        <div className="flex flex-col font-tahoma text-[11px] text-text-main">

            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] mb-[15px]">
                    <div className="bg-bg-box border border-border p-[10px] text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.stats.total_posts')}</div>
                        <div className="text-[18px] text-theme-link font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.stats.today')}</div>
                        <div className="text-[18px] text-theme-success font-bold">{stats.today}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.stats.unchecked')}</div>
                        <div className="text-[18px] text-theme-error font-bold">{stats.unchecked}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('common.reposts')}</div>
                        <div className="text-[18px] text-[#d39e00] font-bold">{stats.reposts}</div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSearch} className="flex gap-[10px] items-end mb-[15px] bg-bg-box p-[15px] border border-border flex-wrap">
                <div className="flex-1 min-w-[150px]">
                    <Input
                        label={t('admin.posts.filter_label')}
                        type="text"
                        placeholder={t('admin.posts.filter_placeholder')}
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                    />
                </div>

                <div className="w-[120px]">
                    <DateInput
                        label={t('common.date_from')}
                        value={dateFrom}
                        onChange={(e) => {
                            setDateFrom(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="w-[120px]">
                    <DateInput
                        label={t('common.date_to')}
                        value={dateTo}
                        onChange={(e) => {
                            setDateTo(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>

                <div className="w-[140px]">
                    <label className="block text-text-muted text-[10px] uppercase font-bold mb-[2px]">{t('admin.posts.checked_status')}</label>
                    <CustomSelect
                        options={checkOptions}
                        value={isCheckedFilter}
                        onChange={(v) => {
                            setIsCheckedFilter(v);
                            setPage(1);
                        }}
                    />
                </div>

                <Button type="submit" className="h-[28px] px-[15px] mb-[1px]">{t('action.find')}</Button>
            </form>

            <InfiniteScrollList
                className="flex flex-col gap-[15px]"
                itemsCount={posts.length}
                isLoadingInitial={isLoading}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                onLoadMore={loadMore}
                error={false}
                onRetry={() => fetchPostsAndStats(targetUser, page, false, isCheckedFilter, dateFrom, dateTo)}
                emptyState={
                    <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border flex flex-col gap-[5px]">
                        <h3 className="m-0 font-bold text-text-main">{t('empty.posts')}</h3>
                        <p className="m-0">{t('admin.posts.not_found_desc')}</p>
                    </div>
                }
            >
                {posts.map(post => (
                    <div key={post.id} className="bg-bg-box border border-border p-[12px] flex flex-col">

                        <div className="flex justify-between items-center bg-bg-page border border-border p-[6px_10px] mb-[10px]">
                            <div className="flex items-center gap-[10px]">
                                <span className="font-bold text-text-muted">ID: {post.id}</span>
                                {post.is_checked ? (
                                    <span className="text-theme-success font-bold flex items-center gap-[4px]">
                                        <VerifiedIcon width={12} height={12} className="fill-current" /> {t('admin.posts.checked')}
                                    </span>
                                ) : (
                                    <span className="text-[#d39e00] font-bold">
                                        {t('admin.posts.unchecked')}
                                    </span>
                                )}
                            </div>

                            <div className="flex gap-[6px]">
                                {isAdmin && (
                                    <button
                                        className={`cursor-pointer px-[8px] py-[2px] text-[10px] font-bold rounded-[2px] transition-colors border outline-none ${post.is_checked ? 'border-border text-text-muted hover:border-theme-error hover:text-theme-error bg-transparent' : 'border-theme-success text-theme-success bg-[rgba(75,179,75,0.1)] hover:bg-theme-success hover:text-white'}`}
                                        onClick={() => handleToggleCheck(post.id)}
                                        title={post.is_checked ? t('admin.posts.mark_unchecked') : t('admin.posts.mark_checked')}
                                    >
                                        {post.is_checked ? <CloseIcon width={14} height={14} /> : <VerifiedIcon width={14} height={14} className="fill-current" />}
                                    </button>
                                )}
                                {isAdmin && (
                                    <button
                                        className="cursor-pointer p-[6px] rounded-[2px] transition-colors flex items-center justify-center border border-border text-text-muted hover:border-theme-link hover:text-theme-link bg-transparent outline-none"
                                        onClick={() => startEditing(post)}
                                        title={t('action.edit')}
                                    >
                                        <EditIcon width={14} height={14} />
                                    </button>
                                )}
                                <button
                                    className="cursor-pointer p-[6px] rounded-[2px] transition-colors flex items-center justify-center border border-border text-text-muted hover:border-theme-error hover:text-theme-error bg-transparent outline-none"
                                    onClick={() => handleDelete(post.id)}
                                    title={t('action.delete')}
                                >
                                    <DeleteIcon width={14} height={14} />
                                </button>
                            </div>
                        </div>

                        <div className="opacity-95 admin-readonly-post">
                            <PostItem
                                post={post}
                                readonly={true}
                                currentUsername={currentUser?.username}
                                isAdmin={isAdmin}
                                onEdit={() => startEditing(post)}
                                onDelete={handleDelete}
                            />
                        </div>

                    </div>
                ))}
            </InfiniteScrollList>

            {editingPost && (
                <EditPostModal
                    isOpen={!!editingPostId}
                    post={editingPost}
                    onClose={cancelEditing}
                    onSaveSuccess={saveEdit}
                />
            )}
        </div>
    );
};
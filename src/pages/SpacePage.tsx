import { useContext, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/hooks/usePageTitle';
import SpaceRightSidebar from '@/components/spaces/SpaceRightSidebar';
import SpaceMobileHeader from '@/components/spaces/SpaceMobileHeader';
import SpaceWallTab from '@/components/spaces/SpaceWallTab';
import SpaceSettingsTab from '@/components/spaces/SpaceSettingsTab';
import SpaceStatsTab from '@/components/spaces/SpaceStatsTab';
import SpaceMembersTab from '@/components/spaces/SpaceMembersTab';
import SpaceInvitesTab from '@/components/spaces/SpaceInvitesTab';
import SpaceRulesTab from '@/components/spaces/SpaceRulesTab';
import SpaceHeaderInfo from '@/components/spaces/SpaceHeaderInfo';
import SpaceService from '@/services/space.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import { SpaceProvider } from '@/context/SpaceContext';
import { SpaceContext } from '@/context/space-context';
import type { SpaceData } from '@/types/space';

interface ForbiddenBoxProps {
    message: string;
}

const ForbiddenBox = ({ message }: ForbiddenBoxProps) => (
    <div className="p-[20px] bg-bg-box border border-border text-center text-text-muted">
        {message}
    </div>
);

const RestrictedSpaceBox = () => {
    const { t } = useTranslation();
    const { space, updateSpace } = useContext(SpaceContext);
    const [searchParams, setSearchParams] = useSearchParams();
    const [inviteToken, setInviteToken] = useState(searchParams.get('invite') || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!space) return null;

    const privacyType = space.privacy_type ?? 'public';
    const isPending = space.membership_status === 'pending';
    const isClosed = privacyType === 'closed';

    const extractCleanToken = (raw: string): string => {
        const trimmed = raw.trim();
        if (!trimmed) return '';
        try {
            const url = new URL(trimmed);
            const queryInvite = url.searchParams.get('invite');
            if (queryInvite) return queryInvite.trim();
            return url.pathname.split('/').filter(Boolean).pop() || '';
        } catch {
            return trimmed.split('invite=').pop()?.split('/').pop()?.trim() || '';
        }
    };

    const submitJoin = (tokenToUse: string | null = null) => {
        if (isSubmitting || isPending) return;
        if (isClosed && !tokenToUse) return;

        setIsSubmitting(true);
        SpaceService.joinSpace(space.username, tokenToUse || null)
            .onSuccess((res) => {
                notifySuccess(t(`api.success.${res.code}`));
                if (res.code === 'JOIN_REQUEST_SENT') {
                    updateSpace({ is_member: false, membership_status: 'pending' });
                } else {
                    SpaceService.getSpace(space.username)
                        .onSuccess((spaceRes) => {
                            if (spaceRes.space) {
                                updateSpace(spaceRes.space);
                            }
                            if (searchParams.has('invite')) {
                                const nextParams = new URLSearchParams(searchParams);
                                nextParams.delete('invite');
                                setSearchParams(nextParams, { replace: true });
                            }
                        })
                        .onError((err) => {
                            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                        });
                }
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setIsSubmitting(false);
            });
    };

    const handleInviteFormSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const cleanToken = extractCleanToken(inviteToken);
        if (!cleanToken) return;
        submitJoin(cleanToken);
    };

    return (
        <div className="flex flex-col gap-[10px]">
            <SpaceHeaderInfo />

            <div className="bg-bg-box border border-border p-[20px] flex flex-col items-center text-center gap-[10px]">
                <div className="text-[12px] font-bold text-theme-link">
                    {t(`spaces.privacy_${privacyType}`)}
                </div>

                <p className="m-0 text-text-muted max-w-[440px] leading-[1.45]">
                    {isPending
                        ? t('spaces.request_sent_info')
                        : t(`spaces.privacy_desc_${privacyType}`)}
                </p>

                {space.is_member !== null && !isPending && (
                    <div className="flex flex-col items-center gap-[10px] w-full max-w-[360px] mt-[4px]">
                        {!isClosed && !inviteToken.trim() && (
                            <Button
                                type="button"
                                variant="primary"
                                disabled={isSubmitting}
                                onClick={() => submitJoin(null)}
                            >
                                {isSubmitting ? t('common.loading') : t('spaces.request_join')}
                            </Button>
                        )}

                        <form onSubmit={handleInviteFormSubmit} className="flex items-center gap-[6px] w-full">
                            <div className="flex-1">
                                <Input
                                    type="text"
                                    value={inviteToken}
                                    onChange={(e) => setInviteToken(e.target.value)}
                                    placeholder={t('spaces.invite_token_placeholder')}
                                />
                            </div>
                            <Button
                                type="submit"
                                variant={isClosed || inviteToken.trim() ? 'primary' : 'secondary'}
                                disabled={isSubmitting || !inviteToken.trim()}
                            >
                                {isSubmitting ? t('common.loading') : t('spaces.accept_invite')}
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const SpacePageLayout = () => {
    const { t } = useTranslation();
    const { space, canManageSettings, canManageInvites, canManageMembers } = useContext(SpaceContext);
    const [searchParams] = useSearchParams();

    usePageTitle(space ? space.name : t('common.loading'));

    if (!space) return null;

    const currentTab = searchParams.get('tab') || 'wall';
    const canViewContent = space.can_view_content !== false;

    const renderContent = () => {
        if (!canViewContent) {
            return <RestrictedSpaceBox />;
        }

        switch (currentTab) {
            case 'settings':
                return canManageSettings ? <SpaceSettingsTab /> : <ForbiddenBox message={t('api.error.ERR_FORBIDDEN')} />;
            case 'stats':
                return canManageMembers ? <SpaceStatsTab /> : <ForbiddenBox message={t('api.error.ERR_FORBIDDEN')} />;
            case 'invites':
                return canManageInvites ? <SpaceInvitesTab /> : <ForbiddenBox message={t('api.error.ERR_FORBIDDEN')} />;
            case 'rules':
                return <SpaceRulesTab />;
            case 'members':
                return <SpaceMembersTab />;
            case 'wall':
            default:
                return <SpaceWallTab />;
        }
    };

    return (
        <div className="w-full flex items-start gap-[15px] font-tahoma text-[11px] text-text-main">
            <div className="flex-1 flex flex-col gap-[10px] min-w-0">
                <SpaceMobileHeader currentTab={currentTab} />
                {renderContent()}
            </div>
            <aside className="w-[210px] shrink-0 flex flex-col gap-[10px] max-lg:hidden">
                <SpaceRightSidebar currentTab={currentTab} />
            </aside>
        </div>
    );
};

interface SpacePageProps {
    initialSpaceData: SpaceData | null;
}

const SpacePage = ({ initialSpaceData }: SpacePageProps) => (
    <SpaceProvider initialSpace={initialSpaceData}>
        <SpacePageLayout />
    </SpaceProvider>
);

export default SpacePage;
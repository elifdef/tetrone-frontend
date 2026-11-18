import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import EntityService from '@/services/entity.service';
import ProfilePage from '@/pages/ProfilePage';
import SpacePage from '@/pages/SpacePage';
import NotFoundPage from '@/pages/NotFoundPage';

const EntityResolverPage = () =>
{
    const { handle } = useParams();
    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('invite');
    const { t } = useTranslation();

    const [entityInfo, setEntityInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() =>
    {
        const fetchEntity = async () =>
        {
            try
            {
                setLoading(true);
                const params = inviteToken ? { invite: inviteToken } : {};
                const res = await EntityService.resolveHandle(handle, params);

                if (res)
                {
                    if (Object.hasOwn(res, 'user'))
                    {
                        setEntityInfo({
                            type: 'user',
                            data: res.user,
                        })
                    }
                    else if (Object.hasOwn(res, 'space'))
                    {
                        setEntityInfo({
                            type: 'space',
                            data: res.space,
                        })
                    }
                }
                else
                {
                    setEntityInfo('not_found');
                }
            } catch (error)
            {
                console.log(error);
                setEntityInfo('not_found');
            } finally
            {
                setLoading(false);
            }
        };

        fetchEntity();
    }, [handle, inviteToken]);

    if (loading)
    {
        return (
            <div className="tetrone-fullscreen-center">
                <div className="tetrone-loading">{ t('common.loading') }</div>
            </div>
        );
    }

    if (entityInfo === 'not_found' || !entityInfo)
    {
        return <NotFoundPage/>;
    }

    // Якщо це юзер - віддаємо дані в ProfilePage
    if (entityInfo.type === 'user')
    {
        return <ProfilePage profile={ entityInfo.data }/>;
    }

    // Якщо це простір - віддаємо дані в SpacePage
    if (entityInfo.type === 'space')
    {
        return <SpacePage initialSpaceData={ entityInfo.data }/>;
    }

    return <NotFoundPage/>;
};

export default EntityResolverPage;
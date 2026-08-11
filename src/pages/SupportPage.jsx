import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { usePageTitle } from "../hooks/usePageTitle";
import SupportHome from '../components/support/views/SupportHome';
import SupportFaq from '../components/support/views/SupportFaq';
import SupportTicketList from '../components/support/views/SupportTicketList';
import SupportTicketDetail from '../components/support/views/SupportTicketDetail';
import SupportTicketForm from '../components/support/SupportTicketForm';

const SupportPage = () =>
{
    const { t } = useTranslation();
    usePageTitle(t('support.page_title'));

    const [searchParams, setSearchParams] = useSearchParams();
    const currentView = searchParams.get('view') || 'home';
    const currentCat = searchParams.get('cat');
    const currentTicketId = searchParams.get('ticket_id');

    const navigateTo = (view, extraParams = {}) =>
    {
        setSearchParams({ view, ...extraParams });
    };

    return (
        <div className="tetrone-support-container">
            { currentView === 'home' && <SupportHome navigateTo={ navigateTo }/> }
            { currentView === 'form' &&
                <SupportTicketForm onCancel={ () => navigateTo('home') } onSuccess={ () => navigateTo('tickets') }/> }
            { currentView === 'category' && <SupportFaq navigateTo={ navigateTo } categoryId={ currentCat }/> }
            { currentView === 'tickets' && <SupportTicketList navigateTo={ navigateTo }/> }
            { currentView === 'ticket_detail' &&
                <SupportTicketDetail navigateTo={ navigateTo } ticketId={ currentTicketId }/> }
        </div>
    );
};

export default SupportPage;
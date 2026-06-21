import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTranslation } from 'react-i18next';

export default function ProcessingSkeleton({ type = 'media' }) {
    const { t } = useTranslation();

    if (type === 'audio' || type === 'document') {
        return (
            <div className="tetrone-document-item tetrone-processing-skeleton">
                <div className="tetrone-document-icon skeleton-icon">
                    <Skeleton width="100%" height="100%" />
                </div>
                <div className="tetrone-document-info">
                    <div className="tetrone-document-name">
                        <Skeleton width="60%" />
                    </div>
                    <div className="tetrone-document-size">
                        <Skeleton width="30%" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="tetrone-gallery-image tetrone-processing-skeleton media-box">
            <Skeleton className="tetrone-skeleton-fill" containerClassName="tetrone-skeleton-container" />
            <div className="tetrone-processing-overlay">
            </div>
        </div>
    );
}
import { Link } from 'react-router';
import Avatar from '../../../ui/Avatar';

const ForwardSvg = () => (
    <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
    >
        <polyline points="15 17 20 12 15 7" />
        <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
);

export default function NestedForwardChain({ chain, depth = 1, children }) {
    if (!chain || depth > 4) {
        return <>{children}</>;
    }

    const author = chain.author || {};
    const authorName =
        chain.sender_name ||
        [author.first_name, author.last_name].filter(Boolean).join(' ') ||
        author.username ||
        '';
    const authorLink = author.username ? `/${author.username}` : null;
    const accentColor = author?.personalization?.username_color || 'var(--theme-link)';

    return (
        <div
            className="pl-[10px] border-l-[2px] my-[2px]"
            style={{ borderColor: accentColor }}
        >
            <div className="flex items-center gap-[5px] mb-[3px] text-[10px] text-text-muted">
                <ForwardSvg />
                {author.username && (
                    <Link to={authorLink}>
                        <Avatar
                            user={author}
                            className="w-[16px] h-[16px] object-cover border border-border block"
                        />
                    </Link>
                )}
                {authorLink ? (
                    <Link
                        to={authorLink}
                        className="font-bold hover:underline"
                        style={{ color: accentColor }}
                    >
                        {authorName}
                    </Link>
                ) : (
                    <span className="font-bold" style={{ color: accentColor }}>
                        {authorName}
                    </span>
                )}
                {chain.date && (
                    <span className="text-[10px] text-text-muted">{chain.date}</span>
                )}
            </div>
            {chain.forwarded_from ? (
                <NestedForwardChain chain={chain.forwarded_from} depth={depth + 1}>
                    {children}
                </NestedForwardChain>
            ) : (
                children
            )}
        </div>
    );
}
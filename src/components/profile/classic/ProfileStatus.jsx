import RichText from "../../common/RichText";

export default function ProfileStatus({ bio }) {
    if (!bio) return null;

    return (
        <div className="border border-border bg-bg-box p-[8px] mb-[15px] text-text-main italic break-words">
            <RichText text={bio} />
        </div>
    );
}
import { useTranslation } from 'react-i18next';
import RichText from "../../common/RichText";
import { toRichText } from "../../../utils/toRichText";

export default function ProfileStatus({ bio }) {
    const richBio = toRichText(bio);

    return (
        <div className="border border-border bg-bg-box p-[8px] mb-[15px] text-text-main italic break-words">
            <RichText text={richBio} />
        </div>
    );
}
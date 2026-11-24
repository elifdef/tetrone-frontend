import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

export interface GenderPhrases {
    liked: string;
    commented: string;
    reposted: string;
    wall_post: string;
    repost: string;
    wrote: string;
    mentioned: string;
    left_video: string;
    left_image: string;
    left_audio: string;
    left_poll: string;
    left_file: string;
    left_post: string;
    reacted: string;
    accepted_friend: string;
    voted: string;
    replied: string;
    published?: string;
    published_in_space: string;
    kicked_from_space: string;
    changed_space_role: string;
    removed_space_role: string;
}

export const useGender = (_genderValue?: number | null) => {
    const { t } = useTranslation();

    const getGenderMap = useCallback(
        (translate: TFunction = t): Record<number, GenderPhrases> => ({
            1: {
                liked: translate('notifications.liked_male'),
                commented: translate('notifications.commented_male'),
                reposted: translate('notifications.reposted_male'),
                wall_post: translate('notifications.wall_post_male'),
                repost: translate('notifications.repost_male'),
                wrote: translate('notifications.wrote_male'),
                mentioned: translate('notifications.mentioned_male'),
                left_video: translate('notifications.left_video_male'),
                left_image: translate('notifications.left_image_male'),
                left_audio: translate('notifications.left_audio_male'),
                left_poll: translate('notifications.left_poll_male'),
                left_file: translate('notifications.left_file_male'),
                left_post: translate('notifications.left_post_male'),
                reacted: translate('notifications.reacted_male'),
                accepted_friend: translate('notifications.accepted_friend_male'),
                voted: translate('notifications.voted_male'),
                replied: translate('notifications.replied_male'),
                published_in_space: translate('notifications.published_in_space_male'),
                kicked_from_space: translate('notifications.kicked_from_space_male'),
                changed_space_role: translate('notifications.changed_space_role_male'),
                removed_space_role: translate('notifications.removed_space_role_male'),
            },
            2: {
                liked: translate('notifications.liked_female'),
                commented: translate('notifications.commented_female'),
                reposted: translate('notifications.reposted_female'),
                wall_post: translate('notifications.wall_post_female'),
                repost: translate('notifications.repost_female'),
                wrote: translate('notifications.wrote_female'),
                mentioned: translate('notifications.mentioned_female'),
                left_video: translate('notifications.left_video_female'),
                left_image: translate('notifications.left_image_female'),
                left_audio: translate('notifications.left_audio_female'),
                left_poll: translate('notifications.left_poll_female'),
                left_file: translate('notifications.left_file_female'),
                left_post: translate('notifications.left_post_female'),
                reacted: translate('notifications.reacted_female'),
                accepted_friend: translate('notifications.accepted_friend_female'),
                voted: translate('notifications.voted_female'),
                replied: translate('notifications.replied_female'),
                published_in_space: translate('notifications.published_in_space_female'),
                kicked_from_space: translate('notifications.kicked_from_space_female'),
                changed_space_role: translate('notifications.changed_space_role_female'),
                removed_space_role: translate('notifications.removed_space_role_female'),
            },
        }),
        [t]
    );

    return { getGenderMap };
};
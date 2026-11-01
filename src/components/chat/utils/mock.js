const rt = (nodes) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: nodes }]
});

export const fallbackCurrentUser = {
    username: 'elifdef',
    first_name: 'Elifdef',
    last_name: '',
    avatar: '/storage/elifdef/avatar-1793534364-47308cdcac6079ea.webp'
};

export const userTaras = {
    username: 'taras_backend',
    first_name: 'Тарас',
    last_name: 'Бекенд',
    avatar: 'https://picsum.photos/seed/taras_av/100/100',
    last_seen_at: new Date().toISOString()
};

export const userSolomiia = {
    username: 'solomiia_ui',
    first_name: 'Соломія',
    last_name: 'Дизайн',
    avatar: 'https://picsum.photos/seed/solomiia_av/100/100',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
};

export const userVladyslav = {
    username: 'vlad_infra',
    first_name: 'Владислав',
    last_name: 'Девопс',
    avatar: 'https://picsum.photos/seed/vlad_av/100/100',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
};

export const userDmytro = {
    username: 'dmytro_qa',
    first_name: 'Дмитро',
    last_name: 'Сокети',
    avatar: 'https://picsum.photos/seed/dmytro_av/100/100',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
};

export const userDeleted = {
    username: 'deleted_user',
    first_name: 'DELETED',
    last_name: '',
    is_deleted: true,
    avatar: null,
    last_seen_at: null
};

export const mockFriendsList = [
    userTaras,
    userSolomiia,
    userVladyslav,
    userDmytro
];

// Приклад пересланого поста з усім форматуванням TipTap (таблиця, спойлер, код, деталі)
export const createSampleSharedPost = (me) => ({
    id: 'fjkvly9lqxyxlzsc',
    content: {
        type: 'doc',
        content: [
            {
                type: 'heading',
                attrs: { id: 'block-h1', level: 3, textAlign: null },
                content: [{ type: 'text', text: 'Тест форматування та таблиць у пості' }]
            },
            {
                type: 'paragraph',
                attrs: { id: 'block-p1', textAlign: null },
                content: [
                    { type: 'text', text: 'Жирний ', marks: [{ type: 'bold' }] },
                    { type: 'text', text: 'курсив ', marks: [{ type: 'italic' }] },
                    { type: 'text', text: 'спойлер ', marks: [{ type: 'spoiler' }] },
                    { type: 'text', text: 'кольоровий', marks: [{ type: 'textStyle', attrs: { color: '#f74739' } }] }
                ]
            },
            {
                type: 'details',
                attrs: { open: false },
                content: [
                    { type: 'summary', content: [{ type: 'text', text: 'Деталі релізу' }] },
                    { type: 'paragraph', content: [{ type: 'text', text: 'Прихований блок всередині пересланого поста' }] }
                ]
            },
            {
                type: 'table',
                content: [
                    {
                        type: 'tableRow',
                        content: [
                            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Сервіс' }] }] },
                            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'RAM' }] }] }
                        ]
                    },
                    {
                        type: 'tableRow',
                        content: [
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Elasticsearch' }] }] },
                            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '256 MB' }] }] }
                        ]
                    }
                ]
            }
        ]
    },
    is_avatar_update: false,
    youtube_settings: [],
    poll: {
        id: 1,
        question: 'Як вам новий інтерфейс діалогів?',
        is_anonymous: false,
        is_multiple: false,
        total_votes: 12,
        user_voted_option_ids: [1],
        options: [
            { id: 1, text: 'Топ, справжній ретро-вайб', votes_count: 10, percentage: 83 },
            { id: 2, text: 'Потрібно більше таблиць', votes_count: 2, percentage: 17 }
        ]
    },
    attachments: [],
    created_at: '2026-11-01T15:06:10.000000Z',
    updated_at: '2026-11-01T15:06:10.000000Z',
    author_type: 'user',
    author: me,
    target_type: 'user',
    target: me,
    likes_count: 5,
    comments_count: 2,
    reposts_count: 1,
    is_liked: true,
    original_post: null,
    is_repost: false,
    reactions: [],
    is_published: true,
    published_at: '2026-11-01T15:06:10.000000Z',
    is_pinned: false,
    can_comment: true
});

export const buildMockData = (realUser) => {
    const me = realUser && realUser.username ? realUser : fallbackCurrentUser;
    const samplePost = createSampleSharedPost(me);

    const chats = [
        {
            slug: 'saved',
            is_saved: true,
            is_group: false,
            is_pinned: true,
            is_typing: false,
            typing_users: [],
            muted_until: null,
            initiator_username: me.username,
            created_at: '2026-09-01T08:00:00.000Z',
            target_user: me,
            last_message: rt([
                { type: 'text', text: 'Нотатка: не забути перевірити індексацію в ' },
                { type: 'text', text: 'Elasticsearch', marks: [{ type: 'bold' }] }
            ]),
            last_message_files: [],
            last_message_sender_username: me.username,
            last_message_author_type: 'user',
            last_message_author: me,
            is_last_unread: false,
            unread_count: 0,
            updated_at: '2026-11-01T16:00:00.000Z'
        },{
            slug: 'dm_taras_backend',
            is_group: false,
            is_pinned: true,
            is_typing: false,
            typing_users: [],
            muted_until: null,
            initiator_username: me.username,
            created_at: '2026-10-01T10:00:00.000Z',
            target_user: userTaras,
            last_message: rt([
                { type: 'text', text: 'Глянь пересланий пост із таблицею та опитуванням!' }
            ]),
            last_message_files: [],
            last_message_shared_post: samplePost,
            last_message_sender_username: me.username,
            last_message_author_type: 'user',
            last_message_author: me,
            is_last_unread: false,
            unread_count: 0,
            updated_at: '2026-11-01T15:10:00.000Z'
        },
        {
            slug: 'dm_solomiia_ui',
            is_group: false,
            is_pinned: false,
            is_typing: true,
            typing_users: [userSolomiia],
            muted_until: null,
            initiator_username: 'solomiia_ui',
            created_at: '2026-10-05T12:00:00.000Z',
            target_user: userSolomiia,
            last_message: rt([
                { type: 'text', text: 'Папку ' },
                { type: 'text', text: 'modern', marks: [{ type: 'strike' }] },
                { type: 'text', text: ' видалила, тепер усюди чистий ' },
                { type: 'text', text: 'RichText', marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { color: '#5b88bd' } }] },
                { type: 'text', text: '!' }
            ]),
            last_message_files: [],
            last_message_sender_username: 'solomiia_ui',
            last_message_author_type: 'user',
            last_message_author: userSolomiia,
            is_last_unread: true,
            unread_count: 2,
            updated_at: '2026-10-31T18:15:00.000Z'
        },
        {
            slug: 'dm_deleted_user',
            is_group: false,
            is_pinned: false,
            is_typing: false,
            typing_users: [],
            muted_until: 'forever',
            initiator_username: 'deleted_user',
            created_at: '2026-09-20T09:00:00.000Z',
            target_user: userDeleted,
            last_message: rt([
                { type: 'text', text: 'Якщо запускаєш ' },
                { type: 'text', text: './deploy.sh dev --force', marks: [{ type: 'italic' }] },
                { type: 'text', text: ', воно знесе всі томи Postgres і Redis.' }
            ]),
            last_message_files: [],
            last_message_sender_username: 'deleted_user',
            last_message_author_type: 'user',
            last_message_author: userDeleted,
            is_last_unread: false,
            unread_count: 0,
            updated_at: '2026-10-24T14:10:00.000Z'
        },
        {
            slug: 'dm_vlad_infra',
            is_group: false,
            is_pinned: false,
            is_typing: false,
            typing_users: [],
            muted_until: null,
            initiator_username: me.username,
            created_at: '2026-10-12T15:30:00.000Z',
            target_user: userVladyslav,
            last_message: rt([
                { type: 'text', text: 'Я обмежив Elasticsearch до ' },
                { type: 'text', text: '256m', marks: [{ type: 'bold' }] },
                { type: 'text', text: ', тепер весь стек бере 1.3 ГБ замість 5.5 ГБ.' }
            ]),
            last_message_files: [],
            last_message_sender_username: me.username,
            last_message_author_type: 'user',
            last_message_author: me,
            is_last_unread: true,
            unread_count: 0,
            updated_at: '2026-10-31T20:05:33.000Z'
        },
        {
            slug: 'grp_tetrone_core',
            is_group: true,
            is_pinned: true,
            is_typing: false,
            typing_users: [],
            muted_until: null,
            created_at: '2026-09-15T11:00:00.000Z',
            title: rt([
                { type: 'text', text: 'Tetrone Core ', marks: [{ type: 'bold' }] },
                { type: 'text', text: '& Docker', marks: [{ type: 'textStyle', attrs: { color: '#2b587a' } }, { type: 'bold' }] }
            ]),
            description: rt([
                { type: 'text', text: 'Монорепозиторій, скрипти автоматизації ' },
                { type: 'text', text: 'reload.sh', marks: [{ type: 'italic' }] },
                { type: 'text', text: ' та архітектура #docker' }
            ]),
            avatar: 'https://picsum.photos/seed/grp_core/100/100',
            participants_count: 5,
            owner_username: me.username,
            participants: [
                { user: me, role: 'owner' },
                { user: userTaras, role: 'admin' },
                { user: userSolomiia, role: 'member' },
                { user: userVladyslav, role: 'member' },
                { user: userDmytro, role: 'member' }
            ],
            last_message: rt([
                { type: 'text', text: 'Оголошення від імені бесіди: всі повідомлення тепер мають UUIDv7, а чати — унікальний slug.' }
            ]),
            last_message_files: [],
            last_message_sender_username: 'grp_tetrone_core',
            last_message_author_type: 'group',
            last_message_author: null,
            is_last_unread: false,
            unread_count: 0,
            updated_at: '2026-11-01T14:20:00.000Z'
        },
        {
            slug: 'grp_frontend_chats',
            is_group: true,
            is_pinned: false,
            is_typing: true,
            typing_users: [userSolomiia, userDmytro],
            muted_until: null,
            created_at: '2026-10-02T14:20:00.000Z',
            title: rt([
                { type: 'text', text: 'Фронтенд: ', marks: [{ type: 'bold' }] },
                { type: 'text', text: 'Чати', marks: [{ type: 'underline' }, { type: 'bold' }] }
            ]),
            description: rt([
                { type: 'text', text: 'Верстка списку діалогів, вкладки чатів та інтеграція TipTap #frontend' }
            ]),
            avatar: 'https://picsum.photos/seed/grp_front/100/100',
            participants_count: 3,
            owner_username: 'solomiia_ui',
            participants: [
                { user: userSolomiia, role: 'owner' },
                { user: me, role: 'admin' },
                { user: userDmytro, role: 'member' }
            ],
            last_message: rt([
                { type: 'text', text: 'Перевірив відкриття кількох бесід поспіль — вкладки зверху перемикають ' },
                { type: 'text', text: '?id=', marks: [{ type: 'bold' }] },
                { type: 'text', text: ' миттєво.' }
            ]),
            last_message_files: [],
            last_message_sender_username: 'dmytro_qa',
            last_message_author_type: 'user',
            last_message_author: userDmytro,
            is_last_unread: true,
            unread_count: 4,
            updated_at: '2026-10-31T21:30:45.000Z'
        },
        {
            slug: 'grp_devops_env',
            is_group: true,
            is_pinned: false,
            is_typing: false,
            typing_users: [],
            muted_until: null,
            created_at: '2026-10-08T18:00:00.000Z',
            title: rt([
                { type: 'text', text: 'DevOps: ', marks: [{ type: 'bold' }] },
                { type: 'text', text: 'Prod vs Dev', marks: [{ type: 'italic' }, { type: 'bold' }] }
            ]),
            description: rt([
                { type: 'text', text: 'Конфігурація контейнерів, черг, сокетів та єдиного .env у воркспейсі.' }
            ]),
            avatar: 'https://picsum.photos/seed/grp_devops/100/100',
            participants_count: 4,
            owner_username: 'vlad_infra',
            participants: [
                { user: userVladyslav, role: 'owner' },
                { user: me, role: 'admin' },
                { user: userTaras, role: 'member' },
                { user: userDmytro, role: 'member' }
            ],
            last_message: rt([
                { type: 'text', text: 'На проді ніхто руками ' },
                { type: 'text', text: 'docker exec', marks: [{ type: 'strike' }] },
                { type: 'text', text: ' писати не буде, запускаємо просто ' },
                { type: 'text', text: './reload.sh', marks: [{ type: 'bold' }] }
            ]),
            last_message_files: [],
            last_message_sender_username: 'vlad_infra',
            last_message_author_type: 'user',
            last_message_author: userVladyslav,
            is_last_unread: false,
            unread_count: 0,
            updated_at: '2026-10-30T16:50:12.000Z'
        },
        {
            slug: 'grp_qa_contracts',
            is_group: true,
            is_pinned: false,
            is_typing: false,
            typing_users: [],
            muted_until: null,
            created_at: '2026-10-15T09:45:00.000Z',
            title: rt([
                { type: 'text', text: 'QA & API ', marks: [{ type: 'bold' }] },
                { type: 'text', text: 'Контракти', marks: [{ type: 'highlight', attrs: { color: '#dae2e8' } }, { type: 'bold' }] }
            ]),
            description: rt([
                { type: 'text', text: 'Тестування Spatie Laravel Data, кодів відповідей та регресія #qa' }
            ]),
            avatar: 'https://picsum.photos/seed/grp_qa/100/100',
            participants_count: 4,
            owner_username: 'dmytro_qa',
            participants: [
                { user: userDmytro, role: 'owner' },
                { user: me, role: 'admin' },
                { user: userTaras, role: 'member' },
                { user: userSolomiia, role: 'member' }
            ],
            last_message: rt([
                { type: 'text', text: 'Бекенд тепер віддає коди помилок виключно англійською, фронт мапить через ' },
                { type: 'text', text: 'api.error', marks: [{ type: 'bold' }] }
            ]),
            last_message_files: [],
            last_message_sender_username: 'dmytro_qa',
            last_message_author_type: 'user',
            last_message_author: userDmytro,
            is_last_unread: true,
            unread_count: 1,
            updated_at: '2026-10-29T12:00:00.000Z'
        }
    ];

    const messagesByChat = {
        'saved': [
            {
                uuid: '0192e8a0-0000-7000-8000-000000000001',
                isMine: true,
                author_type: 'user',
                author: me,
                text: rt([
                    { type: 'text', text: 'У нас Composer на деві сам реєструє пакетний ' },
                    { type: 'text', text: 'TelescopeServiceProvider', marks: [{ type: 'underline' }] },
                    { type: 'text', text: ' через автодискавері.' }
                ]),
                reply_to: {
                    author: userTaras,
                    sender_name: 'Тарас Бекенд',
                    date: '29 жовтня 2026 о 10:19',
                    text: rt([{ type: 'text', text: 'Повідомлення з діалогу з Тарасом' }])
                },
                source_msg_uuid: '0192e8a0-0001-7000-8000-000000000101',
                status: 'read',
                created_at: '2026-10-29T12:00:00.000Z',
                is_edited: false,
                is_pinned: true,
                is_important: true,
                files: []
            },
            {
                uuid: '0192e8a0-0000-7000-8000-000000000002',
                isMine: true,
                author_type: 'user',
                author: me,
                text: rt([
                    { type: 'text', text: 'Нотатка: не забути перевірити індексацію в ' },
                    { type: 'text', text: 'Elasticsearch', marks: [{ type: 'bold' }] }
                ]),
                status: 'read',
                created_at: '2026-11-01T16:00:00.000Z',
                is_edited: false,
                is_pinned: false,
                is_important: true,
                files: []
            }
        ],
        'dm_taras_backend': [
            {
                uuid: '0192e8a0-0001-7000-8000-000000000101',
                isMine: false,
                author_type: 'user',
                author: userTaras,
                text: rt([
                    { type: 'text', text: 'Прокинув кореневий ' },
                    { type: 'text', text: './.env:/var/www/.env', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' напряму в docker-compose.dev.yml і прибрав дубль Telescope.' }
                ]),
                status: 'read',
                created_at: '2026-10-31T19:42:10.000Z',
                is_edited: true,
                is_pinned: true,
                is_important: true,
                files: [
                    { name: 'migrations_done.png', url: 'https://picsum.photos/seed/migrate_ok/380/202', type: 'image/png' }
                ]
            },
            {
                uuid: '0192e8a0-0002-7000-8000-000000000102',
                isMine: true,
                author_type: 'user',
                author: me,
                text: rt([
                    { type: 'text', text: 'Глянь пересланий пост із таблицею та опитуванням!' }
                ]),
                shared_post: samplePost,
                status: 'read',
                created_at: '2026-11-01T15:10:00.000Z',
                is_edited: false,
                is_pinned: false,
                is_important: false,
                files: []
            }
        ],
        'dm_solomiia_ui': [
            {
                uuid: '0192e8a0-0003-7000-8000-000000000201',
                isMine: false,
                author_type: 'user',
                author: userSolomiia,
                text: rt([
                    { type: 'text', text: 'Папку ' },
                    { type: 'text', text: 'modern', marks: [{ type: 'strike' }] },
                    { type: 'text', text: ' видалила, тепер усюди чистий ' },
                    { type: 'text', text: 'RichText', marks: [{ type: 'bold' }, { type: 'textStyle', attrs: { color: '#5b88bd' } }] },
                    { type: 'text', text: '!' }
                ]),
                status: 'read',
                created_at: '2026-10-31T18:15:00.000Z',
                is_edited: false,
                is_pinned: false,
                is_important: false,
                files: []
            }
        ],
        'dm_deleted_user': [
            {
                uuid: '0192e8a0-0004-7000-8000-000000000301',
                isMine: false,
                author_type: 'user',
                author: userDeleted,
                text: rt([
                    { type: 'text', text: 'Якщо запускаєш ' },
                    { type: 'text', text: './deploy.sh dev --force', marks: [{ type: 'italic' }] },
                    { type: 'text', text: ', воно знесе всі томи Postgres і Redis.' }
                ]),
                status: 'read',
                created_at: '2026-10-24T14:10:00.000Z',
                is_edited: false,
                is_pinned: false,
                is_important: false,
                files: []
            }
        ],
        'dm_vlad_infra': [
            {
                uuid: '0192e8a0-0005-7000-8000-000000000401',
                isMine: true,
                author_type: 'user',
                author: me,
                text: rt([
                    { type: 'text', text: 'Я обмежив Elasticsearch до ' },
                    { type: 'text', text: '256m', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ', тепер весь стек бере 1.3 ГБ замість 5.5 ГБ.' }
                ]),
                status: 'sent',
                created_at: '2026-10-31T20:05:33.000Z',
                is_edited: false,
                is_pinned: false,
                is_important: false,
                files: []
            }
        ],
        'grp_tetrone_core': [
            {
                uuid: '0192e8a0-0006-7000-8000-000000000501',
                isMine: false,
                author_type: 'user',
                author: userVladyslav,
                text: rt([
                    { type: 'text', text: 'У deploy.sh стояв chown www-data (UID 33), а твій юзер у WSL має UID 1000. Заміни на chmod 777 для локальної розробки.' }
                ]),
                status: 'read',
                created_at: '2026-10-31T20:43:12.000Z',
                is_edited: false,
                is_pinned: true,
                is_important: true,
                files: []
            },
            {
                uuid: '0192e8a0-0007-7000-8000-000000000502',
                isMine: true,
                author_type: 'group',
                author: {
                    username: 'grp_tetrone_core',
                    first_name: 'Tetrone Core & Docker',
                    last_name: '',
                    avatar: 'https://picsum.photos/seed/grp_core/100/100',
                    is_group_identity: true,
                    rich_title: rt([
                        { type: 'text', text: 'Tetrone Core ', marks: [{ type: 'bold' }] },
                        { type: 'text', text: '& Docker', marks: [{ type: 'textStyle', attrs: { color: '#2b587a' } }, { type: 'bold' }] }
                    ])
                },
                text: rt([
                    { type: 'text', text: 'Оголошення від імені бесіди: всі повідомлення тепер мають UUIDv7, а чати — унікальний slug.' }
                ]),
                status: 'read',
                created_at: '2026-11-01T14:20:00.000Z',
                is_edited: false,
                is_pinned: false,
                is_important: false,
                files: []
            }
        ],
        'grp_frontend_chats': [
            {
                uuid: '0192e8a0-0008-7000-8000-000000000601',
                isMine: false,
                author_type: 'user',
                author: userDmytro,
                text: rt([
                    { type: 'text', text: 'Перевірив відкриття кількох бесід поспіль — вкладки зверху перемикають ' },
                    { type: 'text', text: '?id=', marks: [{ type: 'bold' }] },
                    { type: 'text', text: ' миттєво.' }
                ]),
                status: 'sent',
                created_at: '2026-10-31T21:30:45.000Z',
                is_edited: false,
                is_pinned: false,
                is_important: false,
                files: []
            }
        ],
        'grp_devops_env': [
            {
                uuid: '0192e8a0-0009-7000-8000-000000000701',
                isMine: false,
                author_type: 'user',
                author: userVladyslav,
                text: rt([
                    { type: 'text', text: 'На проді ніхто руками ' },
                    { type: 'text', text: 'docker exec', marks: [{ type: 'strike' }] },
                    { type: 'text', text: ' писати не буде, запускаємо просто ' },
                    { type: 'text', text: './reload.sh', marks: [{ type: 'bold' }] }
                ]),
                status: 'read',
                created_at: '2026-10-30T16:50:12.000Z',
                is_edited: false,
                is_pinned: true,
                is_important: false,
                files: []
            }
        ],
        'grp_qa_contracts': [
            {
                uuid: '0192e8a0-0010-7000-8000-000000000801',
                isMine: false,
                author_type: 'user',
                author: userDmytro,
                text: rt([
                    { type: 'text', text: 'Бекенд тепер віддає коди помилок виключно англійською, фронт мапить через ' },
                    { type: 'text', text: 'api.error', marks: [{ type: 'bold' }] }
                ]),
                status: 'sent',
                created_at: '2026-10-29T12:00:00.000Z',
                is_edited: false,
                is_pinned: false,
                is_important: false,
                files: []
            }
        ]
    };

    return { chats, messagesByChat };
};
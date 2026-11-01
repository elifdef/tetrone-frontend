const rt = (nodes) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content: nodes }]
});

export const mockCurrentUser = {
    id: 1,
    username: 'elifdef',
    first_name: 'Андрій',
    last_name: 'Коваленко',
    avatar: 'https://picsum.photos/seed/elifdef_av/100/100'
};

export const userTaras = {
    id: 11,
    username: 'taras_backend',
    first_name: 'Тарас',
    last_name: 'Бекенд',
    avatar: 'https://picsum.photos/seed/taras_av/100/100',
    last_seen_at: new Date().toISOString()
};

export const userSolomiia = {
    id: 12,
    username: 'solomiia_ui',
    first_name: 'Соломія',
    last_name: 'Дизайн',
    avatar: 'https://picsum.photos/seed/solomiia_av/100/100',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 12).toISOString()
};

export const userVladyslav = {
    id: 13,
    username: 'vlad_infra',
    first_name: 'Владислав',
    last_name: 'Девопс',
    avatar: 'https://picsum.photos/seed/vlad_av/100/100',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
};

export const userDmytro = {
    id: 14,
    username: 'dmytro_qa',
    first_name: 'Дмитро',
    last_name: 'Сокети',
    avatar: 'https://picsum.photos/seed/dmytro_av/100/100',
    last_seen_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
};

export const userDeleted = {
    id: 99,
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
    userDmytro,
];

export const mockChats = [
    {
        id: '101',
        slug: '101',
        is_group: false,
        is_pinned: true,
        is_typing: false,
        muted_until: null,
        initiator_username: 'elifdef',
        created_at: '2026-10-01T10:00:00.000Z',
        target_user: userTaras,
        last_message: rt([
            { type: 'text', text: 'Прибрав дубль ' },
            { type: 'text', text: 'Telescope', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' з AppServiceProvider — міграції пролетіли за секунду.' }
        ]),
        last_message_files: [
            { name: 'migrations_done.png', url: 'https://picsum.photos/seed/migrate_ok/380/202', type: 'image/png' }
        ],
        last_message_sender_id: 11,
        last_message_author: userTaras,
        is_last_unread: true,
        unread_count: 3,
        updated_at: '2026-10-31T19:42:10.000Z'
    },
    {
       id: '102',
        slug: '102',
        is_group: false,
        is_pinned: false,
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
        last_message_sender_id: 12,
        last_message_author: userSolomiia,
        is_last_unread: false,
        unread_count: 0,
        updated_at: '2026-10-31T18:15:00.000Z'
    },
    {
        id: '103',
        slug: '103',
        is_group: false,
        is_pinned: false,
        is_typing: false,
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
        last_message_sender_id: 99,
        last_message_author: userDeleted,
        is_last_unread: false,
        unread_count: 0,
        updated_at: '2026-10-24T14:10:00.000Z'
    },
    {
        id: '104',
        slug: '104',
        is_group: false,
        is_pinned: false,
        is_typing: false,
        muted_until: null,
        initiator_username: 'elifdef',
        created_at: '2026-10-12T15:30:00.000Z',
        target_user: userVladyslav,
        last_message: rt([
            { type: 'text', text: 'Я обмежив Elasticsearch до ' },
            { type: 'text', text: '256m', marks: [{ type: 'bold' }] },
            { type: 'text', text: ', тепер весь стек бере 1.3 ГБ замість 5.5 ГБ.' }
        ]),
        last_message_files: [],
        last_message_sender_id: 1,
        last_message_author: mockCurrentUser,
        is_last_unread: true,
        unread_count: 0,
        updated_at: '2026-10-31T20:05:33.000Z'
    },
    {
       id: '201',
        slug: '201',
        is_group: true,
        is_pinned: true,
        typing_users: [userTaras, userVladyslav, userDmytro],
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
        owner_id: 1,
        participants: [
            { user: mockCurrentUser, role: 'owner' },
            { user: userTaras, role: 'admin' },
            { user: userSolomiia, role: 'member' },
            { user: userVladyslav, role: 'member' },
            { user: userDmytro, role: 'member' }
        ],
        last_message: rt([
            { type: 'text', text: 'Закинув ' },
            { type: 'text', text: 'chmod -R 777', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' на storage у deploy.sh, git restore більше не видає Permission denied.' }
        ]),
        last_message_files: [],
        last_message_sender_id: 1,
        last_message_author: mockCurrentUser,
        is_last_unread: false,
        unread_count: 0,
        updated_at: '2026-10-31T21:10:00.000Z'
    },
    {
       id: '202',
        slug: '202',
        is_group: true,
        is_pinned: false,
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
        owner_id: 12,
        participants: [
            { user: userSolomiia, role: 'owner' },
            { user: mockCurrentUser, role: 'admin' },
            { user: userDmytro, role: 'member' }
        ],
        last_message: rt([
            { type: 'text', text: 'Перевірив відкриття кількох бесід поспіль — вкладки зверху перемикають ' },
            { type: 'text', text: '?id=', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' миттєво.' }
        ]),
        last_message_files: [],
        last_message_sender_id: 14,
        last_message_author: userDmytro,
        is_last_unread: true,
        unread_count: 4,
        updated_at: '2026-10-31T21:30:45.000Z'
    },
    {
        id: '203',
        slug: '203',
        is_group: true,
        is_pinned: false,
        is_typing: false,
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
        owner_id: 13,
        participants: [
            { user: userVladyslav, role: 'owner' },
            { user: mockCurrentUser, role: 'admin' },
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
        last_message_sender_id: 13,
        last_message_author: userVladyslav,
        is_last_unread: false,
        unread_count: 0,
        updated_at: '2026-10-30T16:50:12.000Z'
    },
    {
        id: '204',
        slug: '204',
        is_group: true,
        is_pinned: false,
        is_typing: false,
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
        owner_id: 14,
        participants: [
            { user: userDmytro, role: 'owner' },
            { user: mockCurrentUser, role: 'admin' },
            { user: userTaras, role: 'member' },
            { user: userSolomiia, role: 'member' }
        ],
        last_message: rt([
            { type: 'text', text: 'Бекенд тепер віддає коди помилок виключно англійською, фронт мапить через ' },
            { type: 'text', text: 'api.error', marks: [{ type: 'bold' }] }
        ]),
        last_message_files: [],
        last_message_sender_id: 14,
        last_message_author: userDmytro,
        is_last_unread: true,
        unread_count: 1,
        updated_at: '2026-10-29T12:00:00.000Z'
    }
];

export const mockMessagesByChat = {
    '101': [
        {
            id: 10101,
            isMine: true,
            author: mockCurrentUser,
            text: rt([
                { type: 'text', text: 'Знову та сама помилка при старті ' },
                { type: 'text', text: './deploy.sh dev --force', marks: [{ type: 'bold' }] },
                { type: 'text', text: '. Падає на 512 МБ у Container.php:1582.' }
            ]),
            status: 'read',
            created_at: '2026-10-29T10:14:22.000Z',
            is_edited: false,
            is_pinned: false,
            is_important: false,
            files: []
        },
        {
            id: 10102,
            isMine: false,
            author: userTaras,
            text: rt([
                { type: 'text', text: 'У нас Composer на деві сам реєструє пакетний ' },
                { type: 'text', text: 'TelescopeServiceProvider', marks: [{ type: 'underline' }] },
                { type: 'text', text: ' через автодискавері. А в AppServiceProvider ти викликаєш його вдруге — звідси рекурсія.' }
            ]),
            status: 'read',
            created_at: '2026-10-29T10:19:12.000Z',
            is_edited: false,
            is_pinned: true,
            is_important: true,
            files: []
        },
        {
            id: 10103,
            isMine: true,
            author: mockCurrentUser,
            text: rt([
                { type: 'text', text: 'І ще вилізло: ' },
                { type: 'text', text: 'Deprecated: explode(): Passing null to parameter #2', marks: [{ type: 'spoiler' }] },
                { type: 'text', text: ' у config/cors.php на 22 рядку.' }
            ]),
            status: 'read',
            created_at: '2026-10-31T19:30:11.000Z',
            is_edited: false,
            is_pinned: false,
            is_important: false,
            files: []
        },
        {
            id: 10104,
            isMine: false,
            author: userTaras,
            text: rt([
                { type: 'text', text: 'Прокинув кореневий ' },
                { type: 'text', text: './.env:/var/www/.env', marks: [{ type: 'bold' }] },
                { type: 'text', text: ' напряму в docker-compose.dev.yml і прибрав дубль Telescope — міграції пролетіли за секунду.' }
            ]),
            status: 'sent',
            created_at: '2026-10-31T19:42:10.000Z',
            is_edited: true,
            is_pinned: false,
            is_important: false,
            reply_to: {
                author: mockCurrentUser,
                sender_name: 'Андрій Коваленко',
                date: '31 жовтня 2026 о 19:30',
                text: rt([{ type: 'text', text: 'І ще вилізло: Deprecated: explode() у config/cors.php на 22 рядку.' }])
            },
            files: [
                { name: 'migrations_done.png', url: 'https://picsum.photos/seed/migrate_ok/380/202', type: 'image/png' }
            ]
        }
    ],
    '102': [
        {
            id: 10201,
            isMine: true,
            author: mockCurrentUser,
            text: rt([
                { type: 'text', text: 'Давай повністю приберемо modern тему для чатів і зробимо рендер усіх повідомлень та заголовків груп через ' },
                { type: 'text', text: 'TipTap RichText', marks: [{ type: 'bold' }] },
                { type: 'text', text: '.' }
            ]),
            status: 'read',
            created_at: '2026-10-30T15:10:00.000Z',
            is_edited: false,
            is_pinned: true,
            is_important: true,
            files: []
        },
        {
            id: 10202,
            isMine: false,
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
    '103': [
        {
            id: 10301,
            isMine: false,
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
    '104': [
        {
            id: 10401,
            isMine: true,
            author: mockCurrentUser,
            text: rt([
                { type: 'text', text: 'Чому VmmemWSL бере 5.5 ГБ? У мене 16 ГБ RAM і три IDE відкриті!' }
            ]),
            status: 'read',
            created_at: '2026-10-31T19:50:00.000Z',
            is_edited: false,
            is_pinned: false,
            is_important: false,
            files: [
                { name: 'task_manager_97.png', url: 'https://picsum.photos/seed/ram_usage/380/202', type: 'image/png' }
            ]
        },
        {
            id: 10402,
            isMine: false,
            author: userVladyslav,
            text: rt([
                { type: 'text', text: 'Пропиши у ' },
                { type: 'text', text: '.wslconfig', marks: [{ type: 'bold' }] },
                { type: 'text', text: ' ліміт memory=4GB та виконай drop_caches.' }
            ]),
            status: 'read',
            created_at: '2026-10-31T19:55:42.000Z',
            is_edited: false,
            is_pinned: true,
            is_important: true,
            files: []
        },
        {
            id: 10403,
            isMine: true,
            author: mockCurrentUser,
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
    '201': [
        {
            id: 20101,
            isMine: false,
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
            id: 20102,
            isMine: true,
            author: mockCurrentUser,
            text: rt([
                { type: 'text', text: 'Закинув ' },
                { type: 'text', text: 'chmod -R 777', marks: [{ type: 'bold' }] },
                { type: 'text', text: ' на storage у deploy.sh, git restore більше не видає Permission denied.' }
            ]),
            status: 'read',
            created_at: '2026-10-31T21:10:00.000Z',
            is_edited: false,
            is_pinned: false,
            is_important: false,
            files: []
        }
    ],
    '202': [
        {
            id: 20201,
            isMine: false,
            author: userSolomiia,
            text: rt([
                { type: 'text', text: 'Інтегрувала ' },
                { type: 'text', text: 'ChatScrollContainer', marks: [{ type: 'bold' }] },
                { type: 'text', text: ' та малювання графіті прямо у вікні чату.' }
            ]),
            status: 'read',
            created_at: '2026-10-31T21:16:20.000Z',
            is_edited: false,
            is_pinned: true,
            is_important: false,
            files: []
        },
        {
            id: 20202,
            isMine: false,
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
    '203': [
        {
            id: 20301,
            isMine: false,
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
    '204': [
        {
            id: 20401,
            isMine: false,
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

export const mockMessages = mockMessagesByChat['101'];
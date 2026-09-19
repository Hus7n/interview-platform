create table if not exists interview_codes(
    id              UUID primary key default gen_random_uuid(),
    interview_id    UUID not null unique references interviews(id) on delete cascade,
    code            text not null default '',
    language        varchar(30) not null default 'javascript',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists idx_interview_codes_interview on interview_codes(interview_id);

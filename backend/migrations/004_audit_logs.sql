create table if not exists audit_logs(
    id          UUID primary key default gen_random_uuid(),
    user_id     UUID references users(id) on delete set null,
    action      varchar(50) not null,
    entity      varchar(50) not null,
    entity_id   UUID,
    details     jsonb,
    ip_address  varchar(45),
    created_at  timestamptz not null default now()
);

create index if not exists idx_audit_logs_user on audit_logs(user_id);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_audit_logs_entity on audit_logs(entity, entity_id);
create index if not exists idx_audit_logs_created on audit_logs(created_at);

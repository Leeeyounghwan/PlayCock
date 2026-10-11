create table member (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    name varchar(50) not null,
    grade varchar(20) not null,
    gender varchar(20) not null,
    age_band varchar(20),
    active boolean not null
);

create table play_session (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    session_date date not null,
    name varchar(100) not null,
    status varchar(20) not null,
    started_at timestamp with time zone,
    ended_at timestamp with time zone
);

create table invite_code (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    session_id bigint not null references play_session(id),
    code varchar(20) not null unique,
    expires_at timestamp with time zone not null,
    active boolean not null
);

create table session_participant (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    session_id bigint not null references play_session(id),
    member_id bigint not null references member(id),
    status varchar(20) not null,
    grade_snapshot varchar(20) not null,
    checked_in_at timestamp with time zone,
    game_count integer not null,
    last_match_ended_at timestamp with time zone,
    unique (session_id, member_id)
);

create table court (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    session_id bigint not null references play_session(id),
    name varchar(30) not null,
    sort_order integer not null,
    status varchar(20) not null,
    unique (session_id, name)
);

create table play_match (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    session_id bigint not null references play_session(id),
    court_id bigint references court(id),
    status varchar(20) not null,
    match_type varchar(30) not null,
    started_at timestamp with time zone,
    finished_at timestamp with time zone
);

create table match_player (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    match_id bigint not null references play_match(id),
    session_participant_id bigint not null references session_participant(id),
    team_no integer not null,
    slot_no integer not null,
    grade_snapshot varchar(20) not null,
    unique (match_id, team_no, slot_no)
);

create table finance_entry (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    entry_date date not null,
    type varchar(30) not null,
    category varchar(50) not null,
    amount numeric(12, 2) not null,
    member_id bigint references member(id),
    session_id bigint references play_session(id),
    memo varchar(200),
    kakao_verified boolean not null
);

create table fine_record (
    id bigserial primary key,
    version bigint not null,
    created_at timestamp with time zone not null,
    updated_at timestamp with time zone not null,
    created_by varchar(50) not null,
    updated_by varchar(50) not null,
    member_id bigint not null references member(id),
    reason varchar(100) not null,
    amount numeric(12, 2) not null,
    occurred_on date not null,
    status varchar(20) not null,
    paid_on date,
    finance_entry_id bigint unique references finance_entry(id),
    memo varchar(200)
);

create index idx_session_participant_session_status on session_participant(session_id, status);
create index idx_play_match_session_status on play_match(session_id, status);
create index idx_finance_entry_entry_date on finance_entry(entry_date);

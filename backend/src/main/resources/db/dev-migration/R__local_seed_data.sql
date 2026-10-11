insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '김민수', 'B', 'MALE', '30대', true
where not exists (select 1 from member where name = '김민수');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '박준호', 'D', 'MALE', '20대', true
where not exists (select 1 from member where name = '박준호');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '이영희', 'C', 'FEMALE', '30대', true
where not exists (select 1 from member where name = '이영희');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '정가람', 'BEGINNER', 'FEMALE', '20대', true
where not exists (select 1 from member where name = '정가람');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '서현', 'B', 'FEMALE', '30대', true
where not exists (select 1 from member where name = '서현');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '지훈', 'C', 'MALE', '30대', true
where not exists (select 1 from member where name = '지훈');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '은지', 'BEGINNER', 'FEMALE', '20대', true
where not exists (select 1 from member where name = '은지');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '하늘', 'INTRO', 'MALE', '20대', true
where not exists (select 1 from member where name = '하늘');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '최지수', 'C', 'FEMALE', '30대', true
where not exists (select 1 from member where name = '최지수');

insert into member (version, created_at, updated_at, created_by, updated_by, name, grade, gender, age_band, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', '정우', 'BEGINNER', 'MALE', '40대', true
where not exists (select 1 from member where name = '정우');

insert into play_session (version, created_at, updated_at, created_by, updated_by, session_date, name, status, started_at, ended_at)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', date '2026-09-22', '화요모임', 'OPEN', current_timestamp, null
where not exists (select 1 from play_session where session_date = date '2026-09-22' and name = '화요모임');

insert into invite_code (version, created_at, updated_at, created_by, updated_by, session_id, code, expires_at, active)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', ps.id, 'PLAY0922', dateadd('day', 1, current_timestamp), true
from play_session ps
where ps.session_date = date '2026-09-22'
  and ps.name = '화요모임'
  and not exists (select 1 from invite_code where code = 'PLAY0922');

insert into court (version, created_at, updated_at, created_by, updated_by, session_id, name, sort_order, status)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', ps.id, seed.name, seed.sort_order, 'OPEN'
from play_session ps
cross join (
    values ('8코트', 1), ('1코트', 2), ('3코트', 3), ('11코트', 4)
) as seed(name, sort_order)
where ps.session_date = date '2026-09-22'
  and ps.name = '화요모임'
  and not exists (select 1 from court where session_id = ps.id and name = seed.name);

insert into session_participant (version, created_at, updated_at, created_by, updated_by, session_id, member_id, status, grade_snapshot, checked_in_at, game_count, last_match_ended_at)
select 0, current_timestamp, current_timestamp, 'local-seed', 'local-seed', ps.id, m.id,
       case when m.name in ('김민수', '박준호', '이영희', '정가람', '서현', '지훈', '은지', '하늘', '최지수', '정우') then 'WAITING' else 'NOT_ARRIVED' end,
       m.grade,
       case when m.name in ('김민수', '박준호', '이영희', '정가람', '서현', '지훈', '은지', '하늘', '최지수', '정우') then current_timestamp else null end,
       case
           when m.name in ('지훈', '최지수') then 2
           when m.name in ('하늘') then 0
           else 1
       end,
       null
from play_session ps
join member m on m.name in ('김민수', '박준호', '이영희', '정가람', '서현', '지훈', '은지', '하늘', '최지수', '정우')
where ps.session_date = date '2026-09-22'
  and ps.name = '화요모임'
  and not exists (select 1 from session_participant where session_id = ps.id and member_id = m.id);

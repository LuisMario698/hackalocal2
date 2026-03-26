-- ============================================================================
-- Social Clean — Esquema completo de base de datos
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 0. LIMPIEZA (drop todo si existe para re-ejecutar)
-- ============================================================================

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_feed_post_created on feed_posts;
drop trigger if exists on_report_status_change on reports;
drop trigger if exists on_volunteer_completed on service_volunteers;
drop trigger if exists on_report_auto_verify on reports;

drop function if exists handle_new_user() cascade;
drop function if exists handle_feed_post_priority() cascade;
drop function if exists handle_report_status_change() cascade;
drop function if exists handle_volunteer_completed() cascade;
drop function if exists handle_auto_verify_report() cascade;
drop function if exists add_eco_points(uuid, int, text, text, uuid) cascade;
drop function if exists update_user_streak(uuid) cascade;
drop function if exists check_and_award_badges(uuid) cascade;
drop function if exists verify_report(uuid, uuid) cascade;
drop function if exists reject_report(uuid, uuid, text) cascade;
drop function if exists place_bid(uuid, uuid, float) cascade;
drop function if exists claim_reward(uuid, uuid) cascade;
drop function if exists redeem_qr_code(text) cascade;
drop function if exists compute_feed_priority(uuid, uuid) cascade;
drop function if exists is_admin(uuid) cascade;
drop function if exists is_verifier(uuid) cascade;
drop function if exists is_association_owner(uuid, uuid) cascade;
drop function if exists is_association_member(uuid, uuid) cascade;

drop table if exists notifications cascade;
drop table if exists ai_content_drafts cascade;
drop table if exists ai_messages cascade;
drop table if exists ai_conversations cascade;
drop table if exists auction_bids cascade;
drop table if exists auctions cascade;
drop table if exists marketplace_messages cascade;
drop table if exists marketplace_listings cascade;
drop table if exists leaderboard_monthly cascade;
drop table if exists points_history cascade;
drop table if exists user_badges cascade;
drop table if exists badges cascade;
drop table if exists reward_claims cascade;
drop table if exists rewards cascade;
drop table if exists feed_post_comments cascade;
drop table if exists feed_post_likes cascade;
drop table if exists feed_posts cascade;
drop table if exists service_volunteers cascade;
drop table if exists joint_service_associations cascade;
drop table if exists community_services cascade;
drop table if exists report_comments cascade;
drop table if exists report_likes cascade;
drop table if exists reports cascade;
drop table if exists association_members cascade;
drop table if exists associations cascade;
drop table if exists profiles cascade;

drop type if exists user_role cascade;
drop type if exists report_category cascade;
drop type if exists report_status cascade;
drop type if exists service_status cascade;
drop type if exists volunteer_status cascade;
drop type if exists feed_post_type cascade;
drop type if exists feed_priority cascade;
drop type if exists reward_type cascade;
drop type if exists claim_status cascade;
drop type if exists listing_status cascade;
drop type if exists material_type cascade;
drop type if exists auction_status cascade;

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

create type user_role as enum ('client', 'association', 'admin');
create type report_category as enum ('trash', 'pothole', 'drain', 'water', 'wildlife', 'electronic', 'organic', 'other');
create type report_status as enum ('pending', 'verified', 'in_progress', 'resolved', 'rejected');
create type service_status as enum ('draft', 'open', 'in_progress', 'completed', 'cancelled');
create type volunteer_status as enum ('applied', 'accepted', 'rejected', 'completed');
create type feed_post_type as enum ('report', 'notice', 'info', 'educational');
create type feed_priority as enum ('normal', 'medium', 'high', 'critical');
create type reward_type as enum ('bonus', 'promotion', 'coupon');
create type claim_status as enum ('active', 'redeemed', 'expired');
create type listing_status as enum ('active', 'sold', 'cancelled', 'expired');
create type material_type as enum ('plastic', 'glass', 'metal', 'paper', 'cardboard', 'electronic', 'organic', 'textile', 'wood', 'other');
create type auction_status as enum ('scheduled', 'active', 'ended', 'cancelled');

-- ============================================================================
-- 2. TABLAS — Identidad
-- ============================================================================

-- Profiles (extiende auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  role user_role default 'client',
  can_verify_reports boolean default false,  -- admin otorga este permiso
  eco_points int default 0,
  level int default 1,
  reports_count int default 0,
  tasks_completed int default 0,
  streak_days int default 0,
  last_active_date date,
  location_lat float,
  location_lng float,
  notification_radius_km int default 2,
  language text default 'es',
  accessible_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Asociaciones
create table associations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  logo_url text,
  website text,
  phone text,
  email text,
  is_recognized boolean default false,  -- prioridad en feed
  location_lat float,
  location_lng float,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Miembros de asociaciones (M:N)
create table association_members (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references associations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text default 'member' check (role in ('member', 'coordinator')),
  joined_at timestamptz default now(),
  unique(association_id, user_id)
);

-- ============================================================================
-- 3. TABLAS — Reportes
-- ============================================================================

create table reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  association_id uuid references associations(id) on delete set null,
  title text not null,
  description text,
  category report_category not null,
  status report_status default 'pending',
  severity int default 1 check (severity between 1 and 5),
  latitude float not null,
  longitude float not null,
  address text,
  photo_url text,
  photo_after_url text,
  ai_classification jsonb,
  likes_count int default 0,
  comments_count int default 0,
  -- Verificacion
  verified_by uuid references profiles(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  resolved_at timestamptz
);

create table report_likes (
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (report_id, user_id)
);

create table report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  parent_comment_id uuid references report_comments(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 4. TABLAS — Servicios comunitarios
-- ============================================================================

create table community_services (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references associations(id) on delete set null,
  created_by uuid not null references profiles(id) on delete cascade,
  report_id uuid references reports(id) on delete set null,
  title text not null,
  description text,
  status service_status default 'draft',
  points_reward int default 20,
  max_volunteers int default 10,
  current_volunteers int default 0,
  latitude float,
  longitude float,
  address text,
  photo_url text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table joint_service_associations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references community_services(id) on delete cascade,
  association_id uuid not null references associations(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(service_id, association_id)
);

create table service_volunteers (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references community_services(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status volunteer_status default 'applied',
  applied_at timestamptz default now(),
  completed_at timestamptz,
  unique(service_id, user_id)
);

-- ============================================================================
-- 5. TABLAS — Feed social
-- ============================================================================

create table feed_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  association_id uuid references associations(id) on delete set null,
  type feed_post_type default 'report',
  priority feed_priority default 'normal',
  title text not null,
  content text,
  photo_url text,
  report_id uuid references reports(id) on delete set null,
  service_id uuid references community_services(id) on delete set null,
  is_pinned boolean default false,
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table feed_post_likes (
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (post_id, user_id)
);

create table feed_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references feed_posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  parent_comment_id uuid references feed_post_comments(id) on delete cascade,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- 6. TABLAS — Recompensas
-- ============================================================================

create table rewards (
  id uuid primary key default gen_random_uuid(),
  association_id uuid references associations(id) on delete set null,
  created_by uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  type reward_type default 'coupon',
  points_cost int not null check (points_cost > 0),
  quantity_available int default 100,
  quantity_claimed int default 0,
  image_url text,
  valid_until timestamptz,
  report_id uuid references reports(id) on delete set null,
  service_id uuid references community_services(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table reward_claims (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references rewards(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  qr_code text unique not null,
  qr_secret_hash text not null,
  status claim_status default 'active',
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================================
-- 7. TABLAS — Gamificacion
-- ============================================================================

create table badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon_name text not null,
  criteria jsonb not null,  -- ej: {"type": "reports_count", "threshold": 1}
  points_reward int default 0,
  created_at timestamptz default now()
);

create table user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

create table points_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  points int not null,  -- positivo = ganado, negativo = gastado
  action text not null, -- ej: 'report_verified', 'reward_claimed', 'service_completed'
  reference_type text,  -- ej: 'report', 'reward', 'service'
  reference_id uuid,
  created_at timestamptz default now()
);

create table leaderboard_monthly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  year_month text not null, -- ej: '2026-03'
  points int default 0,
  reports_count int default 0,
  tasks_completed int default 0,
  rank int,
  unique(user_id, year_month)
);

-- ============================================================================
-- 8. TABLAS — Marketplace
-- ============================================================================

create table marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  material material_type not null,
  quantity_kg float not null check (quantity_kg > 0),
  price_per_kg float not null check (price_per_kg >= 0),
  status listing_status default 'active',
  latitude float,
  longitude float,
  address text,
  photos text[],  -- array de URLs
  buyer_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  expires_at timestamptz
);

create table marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references marketplace_listings(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- 9. TABLAS — Subastas
-- ============================================================================

create table auctions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  material material_type not null,
  quantity_kg float not null check (quantity_kg > 0),
  starting_price float not null check (starting_price > 0),
  current_bid float,
  current_bidder_id uuid references profiles(id) on delete set null,
  min_increment float default 1.0,
  status auction_status default 'scheduled',
  photos text[],
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references auctions(id) on delete cascade,
  bidder_id uuid not null references profiles(id) on delete cascade,
  amount float not null check (amount > 0),
  is_winning boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- 10. TABLAS — IA
-- ============================================================================

create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  input_type text default 'text' check (input_type in ('text', 'voice')),
  metadata jsonb,
  created_at timestamptz default now()
);

create table ai_content_drafts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  draft_type text not null check (draft_type in ('report', 'feed_post', 'listing')),
  content jsonb not null,
  is_accepted boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- 11. TABLAS — Sistema
-- ============================================================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null, -- report_update, report_verified, report_rejected, service_invite, reward_received, badge_earned, auction_outbid, etc.
  title text not null,
  body text,
  reference_type text, -- 'report', 'service', 'reward', 'badge', 'auction'
  reference_id uuid,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================================
-- 12. INDEXES
-- ============================================================================

-- Reports
create index idx_reports_status on reports(status);
create index idx_reports_category on reports(category);
create index idx_reports_user on reports(user_id);
create index idx_reports_location on reports(latitude, longitude);
create index idx_reports_created on reports(created_at desc);
create index idx_reports_verified on reports(status) where status != 'pending' and status != 'rejected';

-- Feed
create index idx_feed_posts_created on feed_posts(created_at desc);
create index idx_feed_posts_type on feed_posts(type);
create index idx_feed_posts_user on feed_posts(user_id);
create index idx_feed_posts_report on feed_posts(report_id) where report_id is not null;

-- Comments
create index idx_report_comments_report on report_comments(report_id);
create index idx_feed_post_comments_post on feed_post_comments(post_id);

-- Services
create index idx_services_status on community_services(status);
create index idx_services_scheduled on community_services(scheduled_at);
create index idx_service_volunteers_service on service_volunteers(service_id);
create index idx_service_volunteers_user on service_volunteers(user_id);

-- Gamification
create index idx_points_history_user on points_history(user_id);
create index idx_leaderboard_month on leaderboard_monthly(year_month, points desc);

-- Marketplace
create index idx_listings_status on marketplace_listings(status);
create index idx_listings_material on marketplace_listings(material);
create index idx_listings_seller on marketplace_listings(seller_id);

-- Auctions
create index idx_auctions_status on auctions(status);
create index idx_auctions_ends on auctions(ends_at);
create index idx_auction_bids_auction on auction_bids(auction_id);

-- Messages
create index idx_marketplace_messages_listing on marketplace_messages(listing_id);
create index idx_marketplace_messages_receiver on marketplace_messages(receiver_id, is_read);

-- Notifications
create index idx_notifications_user on notifications(user_id, is_read, created_at desc);

-- AI
create index idx_ai_conversations_user on ai_conversations(user_id);
create index idx_ai_messages_conversation on ai_messages(conversation_id);

-- ============================================================================
-- 13. FUNCIONES HELPER (RLS)
-- ============================================================================

create or replace function is_admin(p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from profiles where id = p_user_id and role = 'admin'
  );
$$ language sql security definer stable;

create or replace function is_verifier(p_user_id uuid)
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = p_user_id
    and (can_verify_reports = true or role = 'admin')
  );
$$ language sql security definer stable;

create or replace function is_association_owner(p_user_id uuid, p_association_id uuid)
returns boolean as $$
  select exists (
    select 1 from associations where id = p_association_id and owner_id = p_user_id
  );
$$ language sql security definer stable;

create or replace function is_association_member(p_user_id uuid, p_association_id uuid)
returns boolean as $$
  select exists (
    select 1 from association_members where user_id = p_user_id and association_id = p_association_id
  );
$$ language sql security definer stable;

-- ============================================================================
-- 14. FUNCIONES DE NEGOCIO
-- ============================================================================

-- Sumar eco-puntos con audit trail y auto level-up
create or replace function add_eco_points(
  p_user_id uuid,
  p_points int,
  p_action text,
  p_ref_type text default null,
  p_ref_id uuid default null
) returns void as $$
declare
  v_new_points int;
  v_new_level int;
begin
  -- Actualizar puntos
  update profiles
  set eco_points = eco_points + p_points,
      updated_at = now()
  where id = p_user_id
  returning eco_points into v_new_points;

  -- Calcular nivel: 1=0, 2=100, 3=300, 4=600, 5=1000
  v_new_level := case
    when v_new_points >= 1000 then 5
    when v_new_points >= 600 then 4
    when v_new_points >= 300 then 3
    when v_new_points >= 100 then 2
    else 1
  end;

  update profiles set level = v_new_level where id = p_user_id;

  -- Registrar en historial
  insert into points_history (user_id, points, action, reference_type, reference_id)
  values (p_user_id, p_points, p_action, p_ref_type, p_ref_id);

  -- Actualizar leaderboard mensual
  insert into leaderboard_monthly (user_id, year_month, points)
  values (p_user_id, to_char(now(), 'YYYY-MM'), p_points)
  on conflict (user_id, year_month)
  do update set points = leaderboard_monthly.points + p_points;
end;
$$ language plpgsql security definer;

-- Actualizar racha diaria
create or replace function update_user_streak(p_user_id uuid)
returns void as $$
declare
  v_last_date date;
begin
  select last_active_date into v_last_date from profiles where id = p_user_id;

  if v_last_date = current_date then
    return; -- ya activo hoy
  elsif v_last_date = current_date - 1 then
    update profiles
    set streak_days = streak_days + 1,
        last_active_date = current_date,
        updated_at = now()
    where id = p_user_id;
  else
    update profiles
    set streak_days = 1,
        last_active_date = current_date,
        updated_at = now()
    where id = p_user_id;
  end if;
end;
$$ language plpgsql security definer;

-- Verificar y otorgar medallas
create or replace function check_and_award_badges(p_user_id uuid)
returns void as $$
declare
  v_badge record;
  v_profile profiles%rowtype;
  v_count int;
begin
  select * into v_profile from profiles where id = p_user_id;

  for v_badge in select * from badges loop
    -- Saltar si ya tiene la medalla
    if exists (select 1 from user_badges where user_id = p_user_id and badge_id = v_badge.id) then
      continue;
    end if;

    -- Evaluar criterio
    v_count := 0;
    case v_badge.criteria->>'type'
      when 'reports_count' then
        v_count := v_profile.reports_count;
      when 'tasks_completed' then
        v_count := v_profile.tasks_completed;
      when 'streak_days' then
        v_count := v_profile.streak_days;
      when 'level' then
        v_count := v_profile.level;
      when 'eco_points' then
        v_count := v_profile.eco_points;
      else
        continue;
    end case;

    if v_count >= (v_badge.criteria->>'threshold')::int then
      insert into user_badges (user_id, badge_id) values (p_user_id, v_badge.id);

      -- Notificar
      insert into notifications (user_id, type, title, body, reference_type, reference_id)
      values (p_user_id, 'badge_earned', 'Medalla desbloqueada', v_badge.name, 'badge', v_badge.id);

      -- Puntos bonus por medalla
      if v_badge.points_reward > 0 then
        perform add_eco_points(p_user_id, v_badge.points_reward, 'badge_earned', 'badge', v_badge.id);
      end if;
    end if;
  end loop;
end;
$$ language plpgsql security definer;

-- Verificar un reporte (cliente verificador o admin)
create or replace function verify_report(p_report_id uuid, p_verifier_id uuid)
returns void as $$
declare
  v_report reports%rowtype;
begin
  -- Validar que el verificador tiene permiso
  if not is_verifier(p_verifier_id) then
    raise exception 'No tienes permiso para verificar reportes';
  end if;

  -- Obtener reporte
  select * into v_report from reports where id = p_report_id;

  if v_report.id is null then
    raise exception 'Reporte no encontrado';
  end if;

  if v_report.status != 'pending' then
    raise exception 'Solo se pueden verificar reportes pendientes';
  end if;

  -- No puede verificar su propio reporte
  if v_report.user_id = p_verifier_id then
    raise exception 'No puedes verificar tu propio reporte';
  end if;

  -- Actualizar reporte
  update reports
  set status = 'verified',
      verified_by = p_verifier_id,
      verified_at = now(),
      updated_at = now()
  where id = p_report_id;

  -- Puntos al creador del reporte (+10)
  perform add_eco_points(v_report.user_id, 10, 'report_verified', 'report', p_report_id);
  update profiles set reports_count = reports_count + 1, updated_at = now() where id = v_report.user_id;

  -- Puntos al verificador (+5)
  perform add_eco_points(p_verifier_id, 5, 'report_verification', 'report', p_report_id);

  -- Actualizar streak de ambos
  perform update_user_streak(v_report.user_id);
  perform update_user_streak(p_verifier_id);

  -- Crear post en feed
  insert into feed_posts (user_id, association_id, type, title, content, photo_url, report_id)
  values (
    v_report.user_id,
    v_report.association_id,
    'report',
    v_report.title,
    v_report.description,
    v_report.photo_url,
    p_report_id
  );

  -- Notificar al creador
  insert into notifications (user_id, type, title, body, reference_type, reference_id)
  values (v_report.user_id, 'report_verified', 'Reporte verificado', 'Tu reporte "' || v_report.title || '" ha sido verificado', 'report', p_report_id);

  -- Check badges para ambos
  perform check_and_award_badges(v_report.user_id);
  perform check_and_award_badges(p_verifier_id);
end;
$$ language plpgsql security definer;

-- Rechazar un reporte
create or replace function reject_report(p_report_id uuid, p_verifier_id uuid, p_reason text)
returns void as $$
declare
  v_report reports%rowtype;
begin
  if not is_verifier(p_verifier_id) then
    raise exception 'No tienes permiso para verificar reportes';
  end if;

  select * into v_report from reports where id = p_report_id;

  if v_report.id is null then
    raise exception 'Reporte no encontrado';
  end if;

  if v_report.status != 'pending' then
    raise exception 'Solo se pueden rechazar reportes pendientes';
  end if;

  update reports
  set status = 'rejected',
      verified_by = p_verifier_id,
      verified_at = now(),
      rejection_reason = p_reason,
      updated_at = now()
  where id = p_report_id;

  -- Notificar al creador
  insert into notifications (user_id, type, title, body, reference_type, reference_id)
  values (v_report.user_id, 'report_rejected', 'Reporte rechazado', 'Tu reporte "' || v_report.title || '" fue rechazado: ' || p_reason, 'report', p_report_id);
end;
$$ language plpgsql security definer;

-- Ofertar en subasta
create or replace function place_bid(p_auction_id uuid, p_bidder_id uuid, p_amount float)
returns void as $$
declare
  v_auction auctions%rowtype;
begin
  select * into v_auction from auctions where id = p_auction_id;

  if v_auction.id is null then
    raise exception 'Subasta no encontrada';
  end if;

  if v_auction.status != 'active' then
    raise exception 'La subasta no esta activa';
  end if;

  if v_auction.seller_id = p_bidder_id then
    raise exception 'No puedes ofertar en tu propia subasta';
  end if;

  if v_auction.current_bid is not null and p_amount < v_auction.current_bid + v_auction.min_increment then
    raise exception 'La oferta debe ser al menos % mas que la actual', v_auction.min_increment;
  end if;

  if v_auction.current_bid is null and p_amount < v_auction.starting_price then
    raise exception 'La oferta debe ser al menos el precio inicial';
  end if;

  -- Marcar oferta anterior como no ganadora
  if v_auction.current_bidder_id is not null then
    update auction_bids
    set is_winning = false
    where auction_id = p_auction_id and bidder_id = v_auction.current_bidder_id and is_winning = true;

    -- Notificar al ofertante anterior
    insert into notifications (user_id, type, title, body, reference_type, reference_id)
    values (v_auction.current_bidder_id, 'auction_outbid', 'Te han superado', 'Alguien oferto mas en "' || v_auction.title || '"', 'auction', p_auction_id);
  end if;

  -- Registrar nueva oferta
  insert into auction_bids (auction_id, bidder_id, amount, is_winning)
  values (p_auction_id, p_bidder_id, p_amount, true);

  -- Actualizar subasta
  update auctions
  set current_bid = p_amount,
      current_bidder_id = p_bidder_id,
      updated_at = now()
  where id = p_auction_id;
end;
$$ language plpgsql security definer;

-- Canjear recompensa (genera QR)
create or replace function claim_reward(p_user_id uuid, p_reward_id uuid)
returns text as $$
declare
  v_reward rewards%rowtype;
  v_profile profiles%rowtype;
  v_qr_code text;
  v_qr_secret text;
begin
  select * into v_reward from rewards where id = p_reward_id;
  select * into v_profile from profiles where id = p_user_id;

  if v_reward.id is null then
    raise exception 'Recompensa no encontrada';
  end if;

  if not v_reward.is_active then
    raise exception 'Recompensa no disponible';
  end if;

  if v_reward.valid_until is not null and v_reward.valid_until < now() then
    raise exception 'Recompensa expirada';
  end if;

  if v_reward.quantity_claimed >= v_reward.quantity_available then
    raise exception 'No quedan cupones disponibles';
  end if;

  if v_profile.eco_points < v_reward.points_cost then
    raise exception 'No tienes suficientes eco-puntos';
  end if;

  -- Generar QR unico
  v_qr_code := 'SC_' || replace(gen_random_uuid()::text, '-', '');
  v_qr_secret := encode(gen_random_bytes(16), 'hex');

  -- Descontar puntos
  perform add_eco_points(p_user_id, -v_reward.points_cost, 'reward_claimed', 'reward', p_reward_id);

  -- Actualizar cantidad
  update rewards
  set quantity_claimed = quantity_claimed + 1,
      updated_at = now()
  where id = p_reward_id;

  -- Crear claim
  insert into reward_claims (reward_id, user_id, qr_code, qr_secret_hash, expires_at)
  values (p_reward_id, p_user_id, v_qr_code, v_qr_secret, v_reward.valid_until);

  -- Notificar
  insert into notifications (user_id, type, title, body, reference_type, reference_id)
  values (p_user_id, 'reward_received', 'Cupon canjeado', 'Canjeaste "' || v_reward.title || '"', 'reward', p_reward_id);

  return v_qr_code;
end;
$$ language plpgsql security definer;

-- Redimir QR en punto de venta
create or replace function redeem_qr_code(p_qr_code text)
returns jsonb as $$
declare
  v_claim reward_claims%rowtype;
  v_reward rewards%rowtype;
begin
  select * into v_claim from reward_claims where qr_code = p_qr_code;

  if v_claim.id is null then
    raise exception 'Cupon no encontrado';
  end if;

  if v_claim.status = 'redeemed' then
    raise exception 'Cupon ya utilizado';
  end if;

  if v_claim.status = 'expired' or (v_claim.expires_at is not null and v_claim.expires_at < now()) then
    raise exception 'Cupon expirado';
  end if;

  select * into v_reward from rewards where id = v_claim.reward_id;

  update reward_claims
  set status = 'redeemed',
      redeemed_at = now()
  where id = v_claim.id;

  return jsonb_build_object(
    'success', true,
    'reward_title', v_reward.title,
    'user_id', v_claim.user_id
  );
end;
$$ language plpgsql security definer;

-- Calcular prioridad de feed post
create or replace function compute_feed_priority(p_user_id uuid, p_association_id uuid)
returns feed_priority as $$
declare
  v_role user_role;
  v_is_recognized boolean;
begin
  select role into v_role from profiles where id = p_user_id;

  if v_role = 'admin' then
    return 'critical';
  end if;

  if p_association_id is not null then
    select is_recognized into v_is_recognized from associations where id = p_association_id;
    if v_is_recognized then
      return 'high';
    end if;
    return 'medium';
  end if;

  return 'normal';
end;
$$ language plpgsql security definer stable;

-- ============================================================================
-- 15. TRIGGERS
-- ============================================================================

-- Auto-crear profile al registrarse
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-calcular prioridad de feed post
create or replace function handle_feed_post_priority()
returns trigger as $$
begin
  new.priority := compute_feed_priority(new.user_id, new.association_id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_feed_post_created
  before insert on feed_posts
  for each row execute function handle_feed_post_priority();

-- Notificar al creador cuando cambia el status del reporte
create or replace function handle_report_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status and new.status in ('in_progress', 'resolved') then
    insert into notifications (user_id, type, title, body, reference_type, reference_id)
    values (
      new.user_id,
      'report_update',
      case new.status
        when 'in_progress' then 'Reporte en progreso'
        when 'resolved' then 'Reporte resuelto'
      end,
      'Tu reporte "' || new.title || '" cambio a ' || new.status::text,
      'report',
      new.id
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_report_status_change
  after update of status on reports
  for each row execute function handle_report_status_change();

-- Cuando un voluntario completa un servicio
create or replace function handle_volunteer_completed()
returns trigger as $$
declare
  v_service community_services%rowtype;
begin
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    select * into v_service from community_services where id = new.service_id;

    -- Sumar puntos
    perform add_eco_points(new.user_id, v_service.points_reward, 'service_completed', 'service', new.service_id);

    -- Actualizar perfil
    update profiles
    set tasks_completed = tasks_completed + 1, updated_at = now()
    where id = new.user_id;

    -- Actualizar streak
    perform update_user_streak(new.user_id);

    -- Notificar
    insert into notifications (user_id, type, title, body, reference_type, reference_id)
    values (new.user_id, 'service_completed', 'Servicio completado', 'Completaste "' || v_service.title || '" y ganaste ' || v_service.points_reward || ' eco-puntos', 'service', new.service_id);

    -- Check badges
    perform check_and_award_badges(new.user_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_volunteer_completed
  after update of status on service_volunteers
  for each row execute function handle_volunteer_completed();

-- Auto-verificar reportes de asociaciones y admin
create or replace function handle_auto_verify_report()
returns trigger as $$
declare
  v_role user_role;
begin
  select role into v_role from profiles where id = new.user_id;

  -- Auto-verificar si es admin o asociacion
  if v_role in ('admin', 'association') then
    new.status := 'verified';
    new.verified_by := new.user_id;
    new.verified_at := now();
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_report_auto_verify
  before insert on reports
  for each row execute function handle_auto_verify_report();

-- ============================================================================
-- 16. SEED DATA — Medallas iniciales
-- ============================================================================

insert into badges (name, description, icon_name, criteria, points_reward) values
  ('Primer Reporte', 'Crea tu primer reporte', 'flag', '{"type": "reports_count", "threshold": 1}', 5),
  ('Limpiador Novato', 'Completa 1 tarea de limpieza', 'broom', '{"type": "tasks_completed", "threshold": 1}', 5),
  ('Cinco Estrellas', 'Completa 5 tareas', 'star', '{"type": "tasks_completed", "threshold": 5}', 10),
  ('Racha Semanal', '7 dias consecutivos activo', 'local-fire-department', '{"type": "streak_days", "threshold": 7}', 15),
  ('Guardian de Playa', 'Completa 10 tareas', 'beach-access', '{"type": "tasks_completed", "threshold": 10}', 20),
  ('Top 10', 'Alcanza 500 eco-puntos', 'emoji-events', '{"type": "eco_points", "threshold": 500}', 25),
  ('Eco-Heroe', 'Alcanza nivel 5', 'military-tech', '{"type": "level", "threshold": 5}', 50);

-- ============================================================================
-- 18. STORAGE BUCKETS (ejecutar manualmente en Supabase Dashboard si es necesario)
-- ============================================================================
-- Nota: Supabase no permite crear buckets via SQL.
-- Crear estos buckets en el Dashboard > Storage:
--   1. avatars (public read, auth write, max 2MB, image/*)
--   2. report-photos (public read, auth write, max 5MB, image/*)
--   3. reward-images (public read, auth write, max 2MB, image/*)
--   4. service-photos (public read, auth write, max 5MB, image/*)
--   5. feed-images (public read, auth write, max 5MB, image/*)
--   6. marketplace-photos (public read, auth write, max 5MB, image/*)
--   7. auction-photos (public read, auth write, max 5MB, image/*)
--   8. association-logos (public read, auth write, max 2MB, image/*)

-- ============================================================================
-- 19. REALTIME (habilitar en Dashboard > Database > Replication)
-- ============================================================================
-- Habilitar realtime en:
--   reports, feed_posts, community_services, service_volunteers,
--   auctions, auction_bids, marketplace_messages, notifications,
--   report_comments, feed_post_comments

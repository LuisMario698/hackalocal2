// Auto-generated types matching 001_complete_schema.sql
// Re-generate if schema changes

export type UserRole = 'client' | 'association' | 'admin';
export type ReportCategory = 'trash' | 'pothole' | 'drain' | 'water' | 'wildlife' | 'electronic' | 'organic' | 'other';
export type ReportStatus = 'pending' | 'verified' | 'in_progress' | 'resolved' | 'rejected';
export type ServiceStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type VolunteerStatus = 'applied' | 'accepted' | 'rejected' | 'completed';
export type FeedPostType = 'report' | 'notice' | 'info' | 'educational';
export type FeedPriority = 'normal' | 'medium' | 'high' | 'critical';
export type RewardType = 'bonus' | 'promotion' | 'coupon';
export type ClaimStatus = 'active' | 'redeemed' | 'expired';
export type ListingStatus = 'active' | 'sold' | 'cancelled' | 'expired';
export type MaterialType = 'plastic' | 'glass' | 'metal' | 'paper' | 'cardboard' | 'electronic' | 'organic' | 'textile' | 'wood' | 'other';
export type AuctionStatus = 'scheduled' | 'active' | 'ended' | 'cancelled';

// ─── Row types ───────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  role: UserRole;
  can_verify_reports: boolean;
  eco_points: number;
  level: number;
  reports_count: number;
  tasks_completed: number;
  streak_days: number;
  last_active_date: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notification_radius_km: number;
  language: string;
  accessible_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface Association {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  is_recognized: boolean;
  location_lat: number | null;
  location_lng: number | null;
  created_at: string;
  updated_at: string;
}

export interface AssociationMember {
  id: string;
  association_id: string;
  user_id: string;
  role: 'member' | 'coordinator';
  joined_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  association_id: string | null;
  title: string;
  description: string | null;
  category: ReportCategory;
  status: ReportStatus;
  severity: number;
  latitude: number;
  longitude: number;
  address: string | null;
  photo_url: string | null;
  photo_after_url: string | null;
  ai_classification: Record<string, unknown> | null;
  likes_count: number;
  comments_count: number;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ReportLike {
  report_id: string;
  user_id: string;
  created_at: string;
}

export interface ReportComment {
  id: string;
  report_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityService {
  id: string;
  association_id: string | null;
  created_by: string;
  report_id: string | null;
  title: string;
  description: string | null;
  status: ServiceStatus;
  points_reward: number;
  max_volunteers: number;
  current_volunteers: number;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  photo_url: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceVolunteer {
  id: string;
  service_id: string;
  user_id: string;
  status: VolunteerStatus;
  applied_at: string;
  completed_at: string | null;
}

export interface FeedPost {
  id: string;
  user_id: string;
  association_id: string | null;
  type: FeedPostType;
  priority: FeedPriority;
  title: string;
  content: string | null;
  photo_url: string | null;
  report_id: string | null;
  service_id: string | null;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface FeedPostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface FeedPostComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: string;
  association_id: string | null;
  created_by: string;
  title: string;
  description: string | null;
  type: RewardType;
  points_cost: number;
  quantity_available: number;
  quantity_claimed: number;
  image_url: string | null;
  valid_until: string | null;
  report_id: string | null;
  service_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardClaim {
  id: string;
  reward_id: string;
  user_id: string;
  qr_code: string;
  qr_secret_hash: string;
  status: ClaimStatus;
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  criteria: Record<string, unknown>;
  points_reward: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}

export interface PointsHistory {
  id: string;
  user_id: string;
  points: number;
  action: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface LeaderboardMonthly {
  id: string;
  user_id: string;
  year_month: string;
  points: number;
  reports_count: number;
  tasks_completed: number;
  rank: number | null;
}

export interface MarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  material: MaterialType;
  quantity_kg: number;
  price_per_kg: number;
  status: ListingStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  photos: string[] | null;
  buyer_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface MarketplaceMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Auction {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  material: MaterialType;
  quantity_kg: number;
  starting_price: number;
  current_bid: number | null;
  current_bidder_id: string | null;
  min_increment: number;
  status: AuctionStatus;
  photos: string[] | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  is_winning: boolean;
  created_at: string;
}

export interface AiConversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  input_type: 'text' | 'voice';
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  reference_type: string | null;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Database type for Supabase client ───────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; name: string }; Update: Partial<Profile> };
      associations: { Row: Association; Insert: Partial<Association> & { owner_id: string; name: string }; Update: Partial<Association> };
      association_members: { Row: AssociationMember; Insert: Partial<AssociationMember> & { association_id: string; user_id: string }; Update: Partial<AssociationMember> };
      reports: { Row: Report; Insert: Partial<Report> & { user_id: string; title: string; category: ReportCategory; latitude: number; longitude: number }; Update: Partial<Report> };
      report_likes: { Row: ReportLike; Insert: { report_id: string; user_id: string }; Update: Partial<ReportLike> };
      report_comments: { Row: ReportComment; Insert: Partial<ReportComment> & { report_id: string; user_id: string; content: string }; Update: Partial<ReportComment> };
      community_services: { Row: CommunityService; Insert: Partial<CommunityService> & { created_by: string; title: string }; Update: Partial<CommunityService> };
      joint_service_associations: { Row: { id: string; service_id: string; association_id: string; joined_at: string }; Insert: { service_id: string; association_id: string }; Update: never };
      service_volunteers: { Row: ServiceVolunteer; Insert: Partial<ServiceVolunteer> & { service_id: string; user_id: string }; Update: Partial<ServiceVolunteer> };
      feed_posts: { Row: FeedPost; Insert: Partial<FeedPost> & { user_id: string; title: string }; Update: Partial<FeedPost> };
      feed_post_likes: { Row: FeedPostLike; Insert: { post_id: string; user_id: string }; Update: Partial<FeedPostLike> };
      feed_post_comments: { Row: FeedPostComment; Insert: Partial<FeedPostComment> & { post_id: string; user_id: string; content: string }; Update: Partial<FeedPostComment> };
      rewards: { Row: Reward; Insert: Partial<Reward> & { created_by: string; title: string; points_cost: number }; Update: Partial<Reward> };
      reward_claims: { Row: RewardClaim; Insert: Partial<RewardClaim> & { reward_id: string; user_id: string; qr_code: string; qr_secret_hash: string }; Update: Partial<RewardClaim> };
      badges: { Row: Badge; Insert: Partial<Badge> & { name: string; description: string; icon_name: string; criteria: Record<string, unknown> }; Update: Partial<Badge> };
      user_badges: { Row: UserBadge; Insert: Partial<UserBadge> & { user_id: string; badge_id: string }; Update: Partial<UserBadge> };
      points_history: { Row: PointsHistory; Insert: Partial<PointsHistory> & { user_id: string; points: number; action: string }; Update: Partial<PointsHistory> };
      leaderboard_monthly: { Row: LeaderboardMonthly; Insert: Partial<LeaderboardMonthly> & { user_id: string; year_month: string }; Update: Partial<LeaderboardMonthly> };
      marketplace_listings: { Row: MarketplaceListing; Insert: Partial<MarketplaceListing> & { seller_id: string; title: string; material: MaterialType; quantity_kg: number; price_per_kg: number }; Update: Partial<MarketplaceListing> };
      marketplace_messages: { Row: MarketplaceMessage; Insert: Partial<MarketplaceMessage> & { listing_id: string; sender_id: string; receiver_id: string; content: string }; Update: Partial<MarketplaceMessage> };
      auctions: { Row: Auction; Insert: Partial<Auction> & { seller_id: string; title: string; material: MaterialType; quantity_kg: number; starting_price: number; starts_at: string; ends_at: string }; Update: Partial<Auction> };
      auction_bids: { Row: AuctionBid; Insert: Partial<AuctionBid> & { auction_id: string; bidder_id: string; amount: number }; Update: Partial<AuctionBid> };
      ai_conversations: { Row: AiConversation; Insert: Partial<AiConversation> & { user_id: string }; Update: Partial<AiConversation> };
      ai_messages: { Row: AiMessage; Insert: Partial<AiMessage> & { conversation_id: string; role: 'user' | 'assistant' | 'system'; content: string }; Update: Partial<AiMessage> };
      ai_content_drafts: { Row: { id: string; conversation_id: string; user_id: string; draft_type: string; content: Record<string, unknown>; is_accepted: boolean; created_at: string }; Insert: { conversation_id: string; user_id: string; draft_type: string; content: Record<string, unknown> }; Update: Partial<{ is_accepted: boolean }> };
      notifications: { Row: Notification; Insert: Partial<Notification> & { user_id: string; type: string; title: string }; Update: Partial<Notification> };
    };
    Functions: {
      add_eco_points: { Args: { p_user_id: string; p_points: number; p_action: string; p_ref_type?: string; p_ref_id?: string }; Returns: void };
      update_user_streak: { Args: { p_user_id: string }; Returns: void };
      check_and_award_badges: { Args: { p_user_id: string }; Returns: void };
      verify_report: { Args: { p_report_id: string; p_verifier_id: string }; Returns: void };
      reject_report: { Args: { p_report_id: string; p_verifier_id: string; p_reason: string }; Returns: void };
      place_bid: { Args: { p_auction_id: string; p_bidder_id: string; p_amount: number }; Returns: void };
      claim_reward: { Args: { p_user_id: string; p_reward_id: string }; Returns: string };
      redeem_qr_code: { Args: { p_qr_code: string }; Returns: Record<string, unknown> };
      is_admin: { Args: { p_user_id: string }; Returns: boolean };
      is_verifier: { Args: { p_user_id: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      report_category: ReportCategory;
      report_status: ReportStatus;
      service_status: ServiceStatus;
      volunteer_status: VolunteerStatus;
      feed_post_type: FeedPostType;
      feed_priority: FeedPriority;
      reward_type: RewardType;
      claim_status: ClaimStatus;
      listing_status: ListingStatus;
      material_type: MaterialType;
      auction_status: AuctionStatus;
    };
  };
}

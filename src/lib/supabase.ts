import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  number: number;
  position: string;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface VotingCode {
  id: string;
  code: string;
  status: 'valid' | 'used' | 'disabled';
  used_at: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  code_id: string;
  player_1_id: string;
  player_2_id: string;
  player_3_id: string;
  player_4_id: string;
  player_5_id: string;
  bonus_player_id: string;  // One of the 5 selected players who gets the bonus
  submitted_at: string;
}

export interface VoteSettings {
  id: number;
  is_open: boolean;
  event_date: string;
  event_name: string;
}

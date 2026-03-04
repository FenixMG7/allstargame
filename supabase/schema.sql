CREATE TABLE IF NOT EXISTS players (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name  TEXT NOT NULL,
  last_name   TEXT NOT NULL,
  number      INTEGER NOT NULL,
  position    TEXT NOT NULL DEFAULT 'PG',
  photo_url   TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voting_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT NOT NULL UNIQUE,
  status      TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'disabled')),
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voting_codes_code ON voting_codes(code);
CREATE INDEX IF NOT EXISTS idx_voting_codes_status ON voting_codes(status);

CREATE TABLE IF NOT EXISTS votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id         UUID NOT NULL REFERENCES voting_codes(id) ON DELETE CASCADE,
  player_1_id     UUID NOT NULL REFERENCES players(id),
  player_2_id     UUID NOT NULL REFERENCES players(id),
  player_3_id     UUID NOT NULL REFERENCES players(id),
  player_4_id     UUID NOT NULL REFERENCES players(id),
  player_5_id     UUID NOT NULL REFERENCES players(id),
  bonus_player_id UUID NOT NULL REFERENCES players(id),
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_code_id ON votes(code_id);

CREATE TABLE IF NOT EXISTS vote_settings (
  id          INTEGER PRIMARY KEY DEFAULT 1,
  is_open     BOOLEAN NOT NULL DEFAULT FALSE,
  event_date  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  event_name  TEXT NOT NULL DEFAULT 'ALL-STAR GAME',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO vote_settings (id, is_open, event_name)
VALUES (1, FALSE, 'ALL-STAR GAME')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION submit_vote(
  p_code_id       UUID,
  p_player_1      UUID,
  p_player_2      UUID,
  p_player_3      UUID,
  p_player_4      UUID,
  p_player_5      UUID,
  p_bonus_player  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_status TEXT;
BEGIN
  SELECT status INTO v_code_status
  FROM voting_codes
  WHERE id = p_code_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'code_not_found');
  END IF;

  IF v_code_status != 'valid' THEN
    RETURN jsonb_build_object('success', false, 'error', 'code_already_used');
  END IF;

  IF NOT (SELECT is_open FROM vote_settings WHERE id = 1) THEN
    RETURN jsonb_build_object('success', false, 'error', 'vote_closed');
  END IF;

  UPDATE voting_codes
  SET status = 'used', used_at = NOW()
  WHERE id = p_code_id;

  INSERT INTO votes (code_id, player_1_id, player_2_id, player_3_id, player_4_id, player_5_id, bonus_player_id)
  VALUES (p_code_id, p_player_1, p_player_2, p_player_3, p_player_4, p_player_5, p_bonus_player);

  RETURN jsonb_build_object('success', true);
END;
$$;

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "players_read_all" ON players FOR SELECT USING (true);
CREATE POLICY "codes_read_all" ON voting_codes FOR SELECT USING (true);
CREATE POLICY "settings_read_all" ON vote_settings FOR SELECT USING (true);

CREATE POLICY "admin_all_players" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_codes" ON voting_codes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_votes" ON votes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_settings" ON vote_settings FOR ALL USING (auth.role() = 'authenticated');

ALTER PUBLICATION supabase_realtime ADD TABLE votes;

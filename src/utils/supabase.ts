import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nxpxrflddcslygljfujg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_QiOlUW1SPCaDRKokWyactA_NJtmDePy';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10, // 과도한 트래픽 방지 안전장치 (초당 최대 10회)
    },
  },
});
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const STATE_ID = 'c44196b3-7497-4e45-9325-5c46276b2f2d';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getState() {
  const { data, error } = await supabase
    .from('state')
    .select('notificationsEnabled,filter')
    .eq('id', STATE_ID)
    .limit(1)
    .single();

  if (error) {
    console.error('Error getting state:', error);
    throw error;
  }
  return data;
}

async function setState(state) {
  const { error } = await supabase.from('state').update({ ...state, id: STATE_ID }).eq('id', STATE_ID );
  if (error) {
    console.error('Error setting state:', error);
    throw error;
  }
}

async function getAds() {
  const { data, error } = await supabase
    .from('ads')
    .select('*');

  if (error) {
    console.error('Error getting ads:', error);
    throw error;
  }

  return data.map(ad => ad.url);
}

async function saveNewAds(ads) {
  const { error } = await supabase.from('ads').insert(ads.map(url => ({ url })));
  if (error) {
    console.error('Error saving new ads:', error);
    throw error;
  }
}

module.exports = {
  getState,
  setState,
  getAds,
  saveNewAds
};

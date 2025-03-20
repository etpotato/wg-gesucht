require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getState() {
  const { data, error } = await supabase
    .from('state')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    throw error;
  }
  return data;
}

async function setState(state) {
  const {error: deleteError} = await supabase.from('state').delete().eq('notificationsEnabled', true);
  if (deleteError) {
    throw deleteError;
  }
  // const { error: insertError } = await supabase.from('state').insert(state);
  // if (insertError) {
  //   throw error;
  // }

}

async function getAds() {
  const { data, error } = await supabase
    .from('ads')
    .select('*');

  if (error) {
    throw error;
  }

  return data.map(ad => ad.url);
}

async function addAds(ads) {
  const { error } = await supabase.from('ads').insert(ads.map(url => ({ url })));
  if (error) {
    throw error;
  }
}

module.exports = {
  getState,
  setState,
  getAds,
  addAds
};

async function test() {
  console.log(await getState());
  console.log(await getAds());
  await setState({
    filter: 'https://www.wg-gesucht.de/wg-zimmer-und-1-zimmer-wohnungen-und-wohnungen-in-Berlin.8.0+1+2.1.0.html?offer_filter=1&city_id=8&sort_order=0&noDeact=1&categories%5B%5D=0&categories%5B%5D=1&categories%5B%5D=2&rent_types%5B%5D=2&ot%5B%5D=126&ot%5B%5D=85077&ot%5B%5D=151&ot%5B%5D=163&ot%5B%5D=178&exc=2',
    notificationsEnabled: false
  });
}

test();
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { getState, setState, getAds, saveNewAds } = require('./supabase');
const { fetchNewAds } = require('./html-parser');

const TIMEOUT = 1000 * 60 * Number(process.env.TIMEOUT_MINUTES);
const HOSTNAME = 'www.wg-gesucht.de';
// const URL = `https://www.wg-gesucht.de/wg-zimmer-und-1-zimmer-wohnungen-und-wohnungen-in-Berlin.8.0+1+2.1.0.html?offer_filter=1&city_id=8&sort_order=0&noDeact=1&categories%5B%5D=0&categories%5B%5D=1&categories%5B%5D=2&rent_types%5B%5D=2&ot%5B%5D=126&ot%5B%5D=85077&ot%5B%5D=151&ot%5B%5D=178&img_only=1`;

const bot = initBot();

main();

async function main() {
  try {
    const [{ filter, notificationsEnabled }, oldAds ] = await Promise.all([getState(), getAds()]);
    const fetchedAds = await fetchNewAds(filter);
    const newAds = calculateNewAds(oldAds, fetchedAds);

    console.log(`${new Date().toISOString()}:`, `found ${newAds.length} new ads`);

    if (!newAds.length) {
      return;
    }

    await saveNewAds(newAds);

    // notify if new items are found
    for (const newAd of newAds) {
      await bot.sendMessage(
        process.env.TG_CHAT_ID,
        newAd,
        { disable_notification: !notificationsEnabled }
      );
    }
  } catch (error) {
    await bot.sendMessage(process.env.TG_CHAT_ID, `Bot error: ${error.message || ''}`);
    console.error(error);
  } finally {
    setTimeout(main, TIMEOUT);
  }
}

function calculateNewAds(oldAds, ads) {
  const newAds = [];
  const oldAdsSet = new Set(oldAds);

  for (const ad of ads) {
    if (!oldAdsSet.has(ad)) {
      newAds.push(ad);
    }
  }

  return newAds;
}

function initBot() {
  const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });

  bot.addListener('message', async (msg) => {
    try {
      if (!msg.text?.startsWith('/filter')) {
        return;
      }

      const proposedUrl = msg.text.split(' ')[1].trim();
      const url = new URL(proposedUrl);
      if (url.hostname !== HOSTNAME) {
        throw new Error('Not a valid wg-gesucht url');
      }
      await setFilterUrl(proposedUrl);
      await bot.sendMessage(process.env.TG_CHAT_ID, `Filter set to ${proposedUrl}`);
      console.log(`${new Date().toISOString()}:`, `updated filter: ${proposedUrl}`);
    } catch (error) {
      await bot.sendMessage(process.env.TG_CHAT_ID, 'Not a valid wg-gesucht url');
      console.log(`${new Date().toISOString()}:`, `invalid filter provided: ${msg.text}`);
    }
  });

  bot.addListener('message', async (msg) => {
    try {
      if (msg.text?.startsWith('/start')) {
        await setNotificationsEnabled(true);
        await bot.sendMessage(process.env.TG_CHAT_ID, 'Notifications enabled');
        console.log(`${new Date().toISOString()}:`, 'notifications enabled');
      } else if (msg.text?.startsWith('/stop')) {
        await setNotificationsEnabled(false);
        await bot.sendMessage(process.env.TG_CHAT_ID, 'Notifications disabled');
        console.log(`${new Date().toISOString()}:`, 'notifications disabled');
      }
    } catch (error) {
      console.error(error);
    }
  });

  bot.addListener('message', async (msg) => {
    try {
      if (msg.text?.startsWith('/get_filter')) {
        const { filter } = await getState();
        await bot.sendMessage(process.env.TG_CHAT_ID, 'Current filter: ' + filter);
        console.log(`${new Date().toISOString()}:`, 'get filter');
      }
    } catch (error) {
      console.error(error);
    }
  });

  return bot;
}

async function setFilterUrl(filter) {
  const state = await getState();
  await setState({ ...state, filter });
}

async function setNotificationsEnabled(notificationsEnabled) {
  const state = await getState();
  await setState({ ...state, notificationsEnabled });
}

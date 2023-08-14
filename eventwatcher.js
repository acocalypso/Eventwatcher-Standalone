require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch-native');
const cheerio = require('cheerio');
const { WebhookClient } = require('discord.js');
const TelegramBot = require('node-telegram-bot-api');

const WEBHOOK_URL = process.env.WEBHOOK_URL.split(',');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const DESTINATION = process.env.DESTINATION || 'both'; // Default to 'both' if not provided
const NOTIFIED_EVENTS_FILE = './logs/notified_events.txt';
const LOCAL_JSON_FILE = './events.json';
const JSON_URL = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json';
const checkInterval = 5 * 60 * 1000;

let notifiedEvents = new Set();

function loadNotifiedEvents() {
  try {
    if (fs.existsSync(NOTIFIED_EVENTS_FILE)) {
      const data = fs.readFileSync(NOTIFIED_EVENTS_FILE, 'utf8');
      notifiedEvents = new Set(data.trim().split('\n'));
    }
  } catch (error) {
    console.error('Error loading notified events:', error);
  }
}

function saveNotifiedEvents() {
  const data = Array.from(notifiedEvents).join('\n');
  fs.writeFileSync(NOTIFIED_EVENTS_FILE, data, 'utf8');
}

/*function sendToDiscord(payload) {
  const webhookClient = new WebhookClient({ url: WEBHOOK_URL });
  webhookClient.send(payload)
    .catch((error) => {
      console.error('Error sending message to Discord:', error);
    });
}*/

function sendToDiscord(WEBHOOK_URL,payload) {
  WEBHOOK_URL.forEach((url) =>{
    const webhookClient = new WebhookClient({ url: url });
    webhookClient.send(payload)
      .catch((error) => {
        console.error('Error sending message to Discord:', error);
      });
  });
}

function sendToTelegram(message) {
  const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN);
  telegramBot.sendMessage(TELEGRAM_CHAT_ID, message)
    .catch((error) => {
      console.error('Error sending message to Telegram:', error);
    });
}

function sendToBoth(payload, message) {
  sendToDiscord(payload);
  sendToTelegram(message);
}


async function fetchEventData() {
  try {
    if (fs.existsSync(LOCAL_JSON_FILE)) {
      const localData = fs.readFileSync(LOCAL_JSON_FILE, 'utf8');
      return JSON.parse(localData);
    } else {
      const response = await fetch(JSON_URL);
      const remoteData = await response.json();
      fs.writeFileSync(LOCAL_JSON_FILE, JSON.stringify(remoteData, null, 2), 'utf8');
      return remoteData;
    }
  } catch (error) {
    console.error('Error fetching event data:', error);
    return null;
  }
}

function getCurrentTime() {
  return new Date().getTime();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

async function fetchDescriptionFromLink(link) {
  try {
    const response = await fetch(link);
    const html = await response.text();
    const $ = cheerio.load(html);
    const eventDescription = $('.event-description').text().trim();
    return eventDescription;
  } catch (error) {
    console.error('Error fetching event description:', error);
    return 'No description provided';
  }
}

async function sendMessageWithEmbed(event) {
  const bonusesArray = [];
  if (event.extraData && event.extraData.communityday && event.extraData.communityday.bonuses) {
    for (const bonus of event.extraData.communityday.bonuses) {
      bonusesArray.push(bonus.text);
    }
  }

  const bonusesText = bonusesArray.length > 0 ? bonusesArray.join('\n') : 'No bonuses available';

    const embed = {
      title: event.name,
      url: event.link,
      description: event.description,
      fields: [
        { name: 'Type', value: event.heading},
        { name: 'Start Time', value: formatDate(event.start) },
        { name: 'End Time', value: formatDate(event.end) },
      ],
      image: {
        url: event.image,
      },
      author: {
        name: 'Eventwatcher',
        icon_url: 'https://lh3.googleusercontent.com/Uzo_GQXZXc1Nsj7OY3dbfRDam0TjTzV4A1dhgSYLzkdrygVRDZgDMv7JME4kEAkS0UFa0MdJevzXynIlc7X6yXRSEV2-XkrRpX1QzJts9-a6=e365-s0'
      },
      color: 0xFF5733,
    };

  if (bonusesText !== 'No bonuses available') {
     embed.fields.push({ name: 'Bonuses', value: bonusesText });
  }

  const payload = {
    embeds: [embed],
  };

  console.log("Sending Event: %s", event.heading);
  
  const message = `**${event.name}**\n\nType: ${event.heading}\nStart Time: ${formatDate(event.start)}\nEnd Time: ${formatDate(event.end)}\n\n${event.description}\n\nBonuses:\n\n${bonusesText}\n\nImage:\n${event.image}`;
    if (DESTINATION === 'discord') {
      sendToDiscord(WEBHOOK_URL,payload);
    } else if (DESTINATION === 'telegram') {
      sendToTelegram(message);
    } else if (DESTINATION === 'both') {
      //sendToBoth(payload, message);
      sendToDiscord(WEBHOOK_URL,payload);
      sendToTelegram(message);
    } else {
      console.error('Invalid DESTINATION value in .env file. Please set it to "discord", "telegram", or "both".');
    }
}

async function checkAndSendEvents() {
  console.log('Checking for events...');
  const eventData = await fetchEventData();
  if (!eventData) return;

  const currentTime = getCurrentTime();
  const currentHour = Math.floor(currentTime / checkInterval);

  for (const event of eventData) {
    const startHour = Math.floor(new Date(event.start).getTime() / checkInterval);
    const endHour = Math.floor(new Date(event.end).getTime() / checkInterval);

    if (!notifiedEvents.has(event.name) && (startHour === currentHour || (startHour < currentHour && currentHour < endHour))) {
      notifiedEvents.add(event.name);
      const description = await fetchDescriptionFromLink(event.link);
      sendMessageWithEmbed({ ...event, description });
    }
  }
  saveNotifiedEvents();
}

function scheduleCheck() {
  loadNotifiedEvents();
  checkAndSendEvents();
  setInterval(checkAndSendEvents, checkInterval);
}

scheduleCheck();

require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');
const { WebhookClient } = require('discord.js');

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const LOCAL_JSON_FILE = './events.json';
const JSON_URL = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json';
const HOUR_IN_MS = 60 * 60 * 1000;

const webhookClient = new WebhookClient({ url: WEBHOOK_URL });

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


async function checkAndSendEvents() {
  const eventData = await fetchEventData();
  if (!eventData) return;

  const currentTime = getCurrentTime();
  const currentHour = Math.floor(currentTime / HOUR_IN_MS);

  for (const event of eventData) {
    const startHour = Math.floor(new Date(event.start).getTime() / HOUR_IN_MS);
    if (startHour === currentHour) {
      sendMessageWithEmbed(event);
    }
  }
}

function sendMessageWithEmbed(event) {
  const description = event.description || 'No description provided';

  // Create an array to store the bonuses if available
  const bonusesArray = [];
  if (event.extraData && event.extraData.communityday && event.extraData.communityday.bonuses) {
    for (const bonus of event.extraData.communityday.bonuses) {
      bonusesArray.push(bonus.text);
    }
  }

  // Join the bonuses array to create the bonusesText
  const bonusesText = bonusesArray.length > 0 ? bonusesArray.join('\n') : 'No bonuses available';


    const embed = {
      title: event.name,
      url: event.link,
      description: description,
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

  webhookClient.send(payload)
    .catch((error) => {
      console.error('Error sending message:', error);
    });
}

function scheduleHourlyCheck() {
  checkAndSendEvents();
  setInterval(checkAndSendEvents, HOUR_IN_MS);
}

scheduleHourlyCheck();

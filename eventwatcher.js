require('dotenv').config();
const fs = require('fs');
const fetch = require('node-fetch');
const { WebhookClient, EmbedBuilder } = require('discord.js');

const WEBHOOK_URL = process.env.WEBHOOK_URL;
const LOCAL_JSON_FILE = './events.json';
const JSON_URL = 'https://raw.githubusercontent.com/ccev/pogoinfo/v2/active/events.json';
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

  const bonusesText = event.bonuses
    ? event.bonuses.map((bonus) => bonus.text).join('\n')
    : 'No bonuses available';

    const embed = {
      title: event.name,
      description: description,
      fields: [
        { name: 'Type', value: event.type},
        { name: 'Has quests', value: event.has_quests},
        { name: 'Start Time', value: event.start },
        { name: 'End Time', value: event.end },
      ],
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

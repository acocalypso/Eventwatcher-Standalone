Standalone Eventwatcher written in NodeJs

This will provide discord webhooks about new events collected by [ScrapeDuck](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json)

Install guide:

- clone repo
- install dependencies (npm install)
- copy .env file (cp .env.example .env)
- provide webhook url
- start script (node eventwatcher.js)

This script will check every hour if a new event is about to start and sents a webhook to discord.

Discord
![Discord](https://github.com/acocalypso/Eventwatcher-Standalone/blob/8a959bd0be4a0d56ab1de8fd8a979f293a5ec733/img/event.png)

Telegram
![Telegram](https://github.com/acocalypso/Eventwatcher-Standalone/blob/e80fc3111d4ff680bed7dd9ac56456a4f5019278/img/telegram.png)
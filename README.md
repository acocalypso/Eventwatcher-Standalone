Standalone Eventwatcher written in NodeJs

This will provide discord webhooks about new events collected by [PogoInfo](https://raw.githubusercontent.com/ccev/pogoinfo/v2/active/events.json)

Install guide:

- clone repo
- install dependencies (npm install)
- copy .env file (cp .env.example .env)
- provide webhook url
- start script (node eventwatcher.js)

This script will check every hour if a new event is about to start and sents a webhook to discord.

![test](https://github.com/acocalypso/Eventwatcher-Standalone/blob/4efbac1d04c86df8018bbbbb3eceb476ae742e93/img/event.png)


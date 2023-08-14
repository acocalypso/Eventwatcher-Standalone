FROM node:18-alpine

WORKDIR /usr/src/app
ADD . ./

ENV HUSKY_SKIP_INSTALL=1
RUN  apk update \
  && apk add --no-cache bash \
  && apk add --no-cache nodejs npm \
  && npm install

CMD node eventwatcher.js

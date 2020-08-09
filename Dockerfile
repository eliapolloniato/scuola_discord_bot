FROM node:12
WORKDIR /usr/src/app

ENV TOKEN $BOT_TOKEN
ENV NODE_ENV production

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]
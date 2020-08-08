FROM node:12
WORKDIR /usr/src/app

# incolla il token al posto di bot-token
ENV TOKEN bot-token
ENV NODE_ENV production

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "start" ]
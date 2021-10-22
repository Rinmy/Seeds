FROM node:16.6.2

RUN npm install -g discord.js

COPY ./src/ /seeds/

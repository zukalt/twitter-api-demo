FROM node:latest

WORKDIR /app

COPY . .

RUN yarn install && yarn run build

CMD yarn start:prod

FROM node:20-alpine

EXPOSE 3000

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn

COPY . ./

ENTRYPOINT ["./entrypoint.sh"]

CMD yarn dev

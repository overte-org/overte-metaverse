FROM node:18-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=development
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN apk update && \
    apk upgrade && \
    apk add git
RUN npm install -g npm@9.8.1
RUN npm install -g npm-run-all
RUN npm install --silent && mv node_modules ../
ENV NODE_ENV=production
COPY . .
EXPOSE 9400
CMD ["npm", "start"]

FROM node:16.16.0
WORKDIR /infra-template
COPY . .
RUN npm ci
RUN npm run build
CMD npm start

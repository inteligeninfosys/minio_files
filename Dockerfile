FROM node:18-alpine3.15

WORKDIR /app

RUN chown node:node -R /app
USER node
# Install app dependencies
COPY --chown=node package*.json ./
RUN npm install --production

# Bundle app source code
COPY --chown=node . .

EXPOSE 4400

CMD ["node" , "index.js"]

# docker build -t migutak/minio_files:5.4 .

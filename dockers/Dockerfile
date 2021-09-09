FROM node:12-slim


RUN apt-get update && \ 
    apt-get install -y build-essential \
    wget \
    python3 \
    make \
    gcc \ 
    libc6-dev 

COPY package*.json ./
RUN npm install

COPY . .

# RUN npm install pm2 -g

# RUN npm rebuild @tensorflow/tfjs-node@1.7.0 --build-from-source
# RUN npm install @tensorflow/tfjs-node@1.7.0

RUN npm run build
# RUN npm run test

ENV PORT 80
EXPOSE 80 

CMD ["node", "./build/scripts/start-worker.js"]
# CMD ["pm2-runtime", "/build/index.js"]
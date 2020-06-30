FROM mhart/alpine-node:12
WORKDIR /app
COPY . /app/
RUN npm install
# RUN npm run build
EXPOSE 3000
CMD [ "npm", "start" ]
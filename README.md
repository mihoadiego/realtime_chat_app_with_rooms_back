# realtime_chat_app_with_rooms_back
HarperDB+Express+SocketIO
## dependancies
Repository realtime_chat_app_with_rooms_front
## npm steps that led to project
npm init -y ## 
npm i axios cors express socket.io dotenv ##
npm i -D nodemon ##
adding then into package.json the following mentions
"scripts": {
    "dev": "nodemon index.js",
}
### run application after
npm run dev 
Served on port 4000

### A .env with HARPERDB_PW and  HARPERDB_URL  
to find associated value for those variables, check in the config of the instance in HarperDB)

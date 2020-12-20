##### Nimble #####

Based on the xrpl trading bot by CryptoCowboy.
This is a version made to work to perform automated buy and sale orders on Binance exchange.
The concecpt is the same except on the settings differ in the setup for adding Binance apikey and secret key.

This is a beta release; Use at your own risk.

Future Developments Includes:

• To work with additional trading pairs, currently its made to work only for XRPUSDT trading pairs.

First is getting your API from Binance(APIKEY and SECRET) which you need to store those value on the following files :

config/apikey.txt

config/secret.txt

To use this bot you need to do the following :
- NodesJS 

*Install additional modules
1. Express
2. Socket.io
3. Request
4. Read-last-lines
5. node-binance-api

Bot Installation Steps

1. Download and extract the files to your working folder (Linux User): eg : /var/www/html/nimble
2. From your terminal, go the the folder where you have extracted all the files and folders.
3. Install NodesJS by typing on you terminal :

$ sudo apt install nodejs

4. Next you need to install Node Package Manager(NPM) with Node.js. NPM is an open source library of Node.js packages. To install NPM, use the following commands: 

$ sudo apt install npm

5. To ensure you have the latest version, update you version by typing the following command on your terminal :

$ sudo apt-get update

$ sudo apt-get upgrade

6. Reboot your system by typing on the terminal :

$ sudo reboot

7. Once your system has reboot, go back to your installation folder and contiue installing the required packages with the following commands on you terminal:

$ npm install express --save

$ npm i socket.io

$ npm i request

$ npm i read-last-lines

$ npm i node-binance-api

8. Once your setup is ready, you can start the bot by typing on your terminal

$ node [path-of-bot]/nimble/index.js


Once you bot is up and running, you can access it at :

http://localhost:3000







'use strict';

var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var io = require('socket.io')(http);
var request = require("request");
var readLastLines = require('read-last-lines');

// Credentials of the account placing the order
var apikey = ''
var secret = ''

// Create an instance of Binance Class
const Binance = require('node-binance-api');
const binance = new Binance();


function getConfigOpt() {
  return new Promise((resolve, reject) => {
      let y = 0
      setTimeout(() => {
      	readFilesOnce();
         resolve(y)
      }, 2000)
  })
}

async function setupConfigConn() {
    let result = await getConfigOpt()
	const setup = {
		APIKEY: apikey,
	  APISECRET: secret,
	  useServerTime: true 
	};

	binance.options(setup);

}; 

setupConfigConn()

/* Milliseconds to wait between checks for a new ledger. */
const INTERVAL = 3000;

/* Number of ledgers to check for valid transaction before failing */
const ledgerOffset = 10;
const maxFee = "0.00001";
const myInstructions = {maxLedgerVersionOffset: ledgerOffset, maxFee: maxFee};

var programStartingTime = 0;

var fixedPoint = 3334.00;

var rangeLow = 0.015;
var rangeHigh = 0.10;

var rangeIncrement = 0.0050;
var rangeIncrementTime = 0.00010;

var rangePercentage = 0.015;
var lastTradeRangePercentage = 0.00;

var closeOrders = 1;

var range = 0.00;

var reserveMultiplier = 0.50;		
var transactionID = 0;
var XRP = 0;
var USD = 0;

var cash = 0.00;
var cashOld = 0.00;
var cashDifference = 0.00;

var reserve = 0.00;
var reserveXRP = 0.00;

var counterparty = 0;
var pricePerShare = 0.00;
var marketValue = 0;
var state = "Stop";
var excecuteDelay = 0;
var connection = "Not connected";
var autoTraderStatus = "Disabled";
var userCount = 0;

var buyVsSell = 0;

var startTime = 0;
var stopTime = 0;

var repeatPrevention = 0;

var totalTransactions = 0;

var dayTradeGains = 0;

var orderPriceBuy = 0.00;
var orderPriceSell = 0.00;


var orderSequence = null;
var orderCancellation = null;
	
var salesMultiplier = 1.00;	
			
var tradeValue = 0.00;

//CUSTOM-NIMBLE-GLOBAL-VAL
var counterpartyCalc = 0.00;
var openorders = 0	 //substitute for openOrders.length		


var buyExecuted = false;
var sellExecuted = false;
var buyOrderID = '';
var sellOrderID = '';
var sellOrderSTAT = '';
var buyOrderSTAT = '';
var XRPBuyQty = 0; 
var XRPSellQty = 0;


var initialCapital = 0;
var startPrice = 0.00;
var xrpForTrade = 0;
var availableUSDT = 0.00;
		
/////
//writeTime();	//	Only call once
//writeFiles();
/////

readFiles();
readFilesOnce();



setTimeout(decreaseRange, 60000);
//getPricePerShare();

binance.websockets.chart("XRPUSDT", "1m", (symbol, interval, chart) => {
  let tick = binance.last(chart);
  const last = chart[tick].close;
  
  pricePerShare = parseFloat(last);
  //console.log('Reading price: ', pricePerShare);
  io.emit('pricePerShare', pricePerShare);	  

});

for (let j = 0; j < process.argv.length; j++) 
{  
	if(j == 2)
	{
		log("Autotrader is booting up.");

		autoTraderStatus = "Enabled";
		state = "Start";
		setTimeout(start, 10000);
	}
    console.log(j + ' -> ' + (process.argv[j]));
}


//	We define a route handler / that gets called when we hit our website home
app.get('/', function(req, res)
{
	res.sendFile(__dirname + '/webpage/index.html');
	
});

app.get('/favicon.ico', function(req, res)
{
	res.sendFile(__dirname + '/webpage/favicon.ico');
	
});

app.get('/xrp.png', function(req, res)
{
	res.sendFile(__dirname + '/webpage/xrp.png');
	
});
app.get('/css/simple-sidebar.css', function(req, res)
{
	res.sendFile(__dirname + '/webpage/css/simple-sidebar.css');
	
});

//	When user connects
io.on('connection', function(socket)
{
	userCount++;
	io.emit('userCount', userCount);
	io.emit('totalTransactions', totalTransactions);

	io.emit('initialCapital', initialCapital);
	io.emit('startPrice', startPrice);
	io.emit('xrpForTrade', xrpForTrade);
	io.emit('availableUSDT', availableUSDT);
	
	console.log('A user connected');
	io.emit('autoTraderStatus', autoTraderStatus);
	updateVariables();
	
	refresh();
	
	readLastLines.read('logs/log.txt', 40)
    .then((lines) => 
	{
		let splitLines = lines.split(/\r?\n/);
		for(var i = 0; i < splitLines.length; i++)
		{
			socket.emit('emit', splitLines[i]);
		}
	});
	
	//	When user sends message
	socket.on('inputReceived', function(message)
	{
		console.log('Message: ' + message);
		io.emit('emit', message);
		
		if(message == "Connect")
		{
			//log("Connecting to Ripple API");
			


		}
		else if(message == "Disconnect")
		{
			//log("Disconnecting from Ripple API");
			
		}
		else if(message == "Exit")
		{
			log("Shutting down server.");
			process.exit();
		}
		else if(message == "Start")
		{
			autoTraderStatus = "Enabled";
			io.emit('autoTraderStatus', autoTraderStatus);
			log("Starting Auto Trader");
			state = "Start";
			start();
		}
		else if(message == "Stop")
		{
			autoTraderStatus = "Disabled";
			io.emit('autoTraderStatus', autoTraderStatus);
			log("Stoping Auto Trader, please wait...");
			
			state = "Stop";
		}
		else if(message == "Reset")
		{

			//binance.cancelAll("XRPUSDT");
			log("Cancelling outstanding orders [reset]"); 

			buyExecuted = false;
			sellExecuted = false;

			buyOrderID = '';
			sellOrderID = '';

			writeTime();
			dayTradeGains = 0.00;
			totalTransactions = 0;	
			reserve = 0.00;			
			reserveXRP = 0.00;		

			writeFiles();
			
			setTimeout(readFiles, 1000);
		}
		else if(message == "BumpRange")
		{
			log("Bumping range.");
			rangePercentage = rangePercentage + rangeIncrement;
		}
		else if(message == "DropRange")
		{
			log("Dropping range.");
			rangePercentage = rangePercentage - rangeIncrement;
		}
		else if(message == "CancelAll"){
			//binance.cancelAll("XRPUSDT");
			log("Cancelling outstanding orders [cancel-all]");

			buyExecuted = false;
			sellExecuted = false;

			buyOrderID = '';
			sellOrderID = '';

		}
	});

	//	When user sends message
	socket.on('updateSettings', function(message)
	{

		var obj = JSON.parse(message);

		initialCapital = obj.initial;
		startPrice = obj.startPrice;
		xrpForTrade = obj.xrpTrade;
		availableUSDT = obj.USDT;

		fixedPoint = (parseFloat(xrpForTrade)*parseFloat(startPrice)).toFixed(2);

		fs.writeFile('data/fixedPoint.txt', fixedPoint, function (err) 
		{
			if (err) throw err;
			console.log('Saved fixedPoint!');
		});

		io.emit('initialCapital', initialCapital);
		io.emit('startPrice', startPrice);
		io.emit('xrpForTrade', xrpForTrade);
		io.emit('availableUSDT', availableUSDT);
		
		fs.writeFile('config/nimble.conf', message, function (err) 
		{
			if (err) throw err;
			console.log('New Config Saved');
		});

		io.emit('configUpdates', true);

	});

	//	When user disconnects
	socket.on('disconnect', function()
	{
		console.log('User disconnected');
		userCount--;
		io.emit('userCount', userCount);
	});

});

function start()
{
	startTimer();
	updateVariables();
	
	refresh();
	
	writeFiles();
	
	console.log('fixedPoint');
	console.log(fixedPoint);
	console.log('dayTradeGains');
	console.log(dayTradeGains);
	console.log('totalTransactions');
	console.log(totalTransactions);

	//console.log('Executing FRAT');
	console.log(' ');
	console.log(' ');

	console.log(pricePerShare);

	if(state == "Stop")
	{
		log("Terminating Auto Trader");
		return 0;
	}

	binance.openOrders(false, (error, openOrders) => {

	  buyVsSell = 0;
	  openorders = 0;

	  for(var x = 0; x< openOrders.length; x++){
	  	var orders = openOrders[x];

	  	if(orders.symbol=='XRPUSDT' && orders.side == 'BUY'){ //TODO : CHANGE TO XRPUSDT SYMBOL
	  		buyVsSell++;
	  		openorders++;

	  		XRPBuyQty = parseFloat(orders.origQty).toFixed(0);  
	  		
	  		io.emit('orderXRPBuy', XRPBuyQty);
	  		
	  		if(orders.status=='NEW' && !buyExecuted){
	  			io.emit('orderPriceBuy', orders.price);
	  			 let buyMsg ='Buy order opened to BUY ' + parseFloat(orders.origQty).toFixed(0) + ' XRP at $' + parseFloat(orders.price).toFixed(6) + ' for ~$' + (parseFloat(orders.origQty)*parseFloat(orders.price)).toFixed(4);
	  			 log(buyMsg);

				 buyExecuted = true;
				 buyOrderID = orders.orderId;

	  		}
	  	
	  	}

	  	if(orders.symbol=='XRPUSDT' && orders.side == 'SELL'){ //TODO : CHANGE TO XRPUSDT SYMBOL
	  		buyVsSell--;
	  		openorders++;

	  		XRPSellQty = parseFloat(orders.origQty).toFixed(0);
	  		
	  		io.emit('orderXRPSell', XRPSellQty);
	  		
	  		if(orders.status=='NEW' && !sellExecuted){
	  			io.emit('orderPriceSell', orders.price);
	  			 let buyMsg ='Buy order opened to SELL ' + parseFloat(orders.origQty).toFixed(0) + ' XRP at $' + parseFloat(orders.price).toFixed(6) + ' for ~$' + (parseFloat(orders.origQty)*parseFloat(orders.price)).toFixed(4);
	  			 log(buyMsg);

				 sellExecuted = true;
				 sellOrderID = orders.orderId;
	  		}

	  	}

	  }

		if(repeatPrevention == 0)
		{

			if((buyVsSell != 0) && (rangePercentage < rangeHigh))
			{
				rangePercentage = rangePercentage + rangeIncrement;
				//rangePercentage = 0.005;	//	Experiment
				lastTradeRangePercentage = rangePercentage;
				//log("New Range Percentage: " + (rangePercentage * 100.00).toFixed(2) + "%");
			}

		}
		
		//	If we need to place orders
		if(openorders == 0 && closeOrders == 0)
		{
			excecuteDelay = 2;
			
			updateVariables();
			
			if((fixedPoint * reserveMultiplier) < cash)
			{			
				if(reserveMultiplier < 5.00)
				{
					reserveMultiplier = parseFloat((parseFloat(reserveMultiplier) + 0.001).toFixed(3));
				}
				
				let fixedPointChange = ((range * reserveMultiplier) / 10.0);	//	Max change to fixedpoint is 50% of range
				fixedPoint = (fixedPoint + fixedPointChange);

				range = fixedPoint * rangePercentage;
				
				log(" ");
				log("Our cash is now in a surplus.");
				
				let mes = "Re-investing " + parseFloat(fixedPointChange.toFixed(2)).toString() + " dollars.";
				log(mes);
				
				log("New fixed point: " + (fixedPoint.toFixed(2)).toString());

				log("New range: " + (range.toFixed(2)).toString());
				
				log("New Reserve Multiplier: " + reserveMultiplier.toString());

				log(" ");
			}
			
			writePriceLog();
			writeTimeout();
			
			
			/* [CREATE BUY AND SALE ORDER] */ 
			
			//buy();
			
		}
		else if ((openorders == 2 && buyVsSell == 0) && closeOrders == 0)
		{
			console.log("Orders already exist.");
			writeTimeout();
		}
		else if((openorders != 2 || buyVsSell != 0) || closeOrders == 1)
		{

			closeOrders = 0;
			excecuteDelay = 1;
			repeatPrevention = 1;

			if(openorders > 0)
			{	

				if(buyExecuted && sellExecuted){

					if(sellExecuted){

						binance.orderStatus("XRPUSDT", sellOrderID, (error, orderStatus, symbol) => {
						  if(orderStatus.status == 'FILLED'){

								log("We sold XRP!");
								totalTransactions++;
								io.emit('totalTransactions', totalTransactions);
					
								dayTradeGains += tradeValue;
								
								let percentageCashVSMax = cash / (marketValue * reserveMultiplier);
								
								if(percentageCashVSMax > 1.0)
								{
									percentageCashVSMax =  1.0;
								}
								
								let inversePercentageCashVsMax = 1.0 - percentageCashVSMax;
								
								if(marketValue > (fixedPoint * 0.95))
								{
									reserve += parseFloat(((parseFloat(tradeValue * (reserveMultiplier / 5.00)) * parseFloat(percentageCashVSMax)) / 10.00).toFixed(2));
										
									reserveXRP += parseFloat(((parseFloat(tradeValue * (reserveMultiplier / 5.00)) * parseFloat(inversePercentageCashVsMax)) / 10.00).toFixed(4));
								}
								
								let mes = "We gained $" + parseFloat(tradeValue.toFixed(2)).toString() + " on that trade.";
								log(mes);

								io.emit('dayTradeGains', dayTradeGains);

								closeOrders = 1;

						  }
						});

					}

					if(buyExecuted){

						binance.orderStatus("XRPUSDT", buyOrderID, (error, orderStatus, symbol) => {
						  if(orderStatus.status == 'FILLED'){

								io.emit('dayTradeGains', dayTradeGains);

								log("We bought XRP!");
								totalTransactions++;
								io.emit('totalTransactions', totalTransactions);

								closeOrders = 1;

						  }
						});						  	

					}

					/* [CANCEL OPEN ORDERS] */				
					
					//binance.cancelAll("XRPUSDT");
					
					/* [CANCEL OPEN ORDERS] */				

					log("Cancelling outstanding orders => buy-executed | sell-executed"); 

				 buyExecuted = false;
				 sellExecuted = false;

				buyOrderID = '';
				sellOrderID = '';
				
				}
			
			openorders = 0;

			}
		}

	});

	/* [GET OPEN ORDERS] */

		if(state == "Start" && excecuteDelay == 1)	//	cancel order
		{
			excecuteDelay = 0;
			setTimeout(start, 25000);
		}
		else if(state == "Start" && excecuteDelay == 2)	//	Place order
		{
			excecuteDelay = 0;
			setTimeout(start, 70000);
		}
		else if(state == "Start" && excecuteDelay == 0)	//	Do nothing
		{
			setTimeout(start, 25000);
		}
		else
		{
			log("Terminating Auto Trader");
		}
	
};


// ----------------------


function shutDown()
{
	process.exit();
}

function decreaseRange()
{
	if(rangePercentage > rangeLow)
	{
		rangePercentage = rangePercentage - rangeIncrementTime;

		if(lastTradeRangePercentage >= (rangePercentage + 0.005))
		{
			log("We havent detected a trade in a while now... Resetting orders.");
			closeOrders = 1;
			lastTradeRangePercentage = rangePercentage;
		}
	}
	
	let maxCash = (fixedPoint * reserveMultiplier);
	let timeWarp = ((maxCash / 2.00) / cash);
	
	let timeoutTime = 300000.00;	//	5 min
	timeoutTime = (timeoutTime * timeWarp);
	timeoutTime = parseInt(timeoutTime);
	
	timeoutTime =  timeoutTime + 300000.00;	//	Add fixed time of 5 min
	
	setTimeout(decreaseRange, timeoutTime);
}	
				
function buy()
{	
	if(buyExecuted) return;

	let buyPoint = fixedPoint - range;	//	Point at which we buy
	let buyPrice = (buyPoint / XRP);	//	Price of shares when we buy
	
	console.log("Used XPP SETTINGS : " + XRP);
	console.log("Used fixedPoint SETTINGS : " + fixedPoint);
	
	orderPriceBuy = buyPrice;

	let shares = range / buyPrice;	//	Shares to trade

	let cost = Number((shares * buyPrice).toFixed(6));	//	Cost for transaction
	
	if((cost + 1.00) >= cash)
	{
		log("We don't have enough USD to trade.");
				
		setTimeout(shutDown, 100);
	}
	
	
	//XRP has 6 significant digits past the decimal point. In other words, XRP cannot be divided into positive values smaller than 0.000001 (1e-6). XRP has a maximum value of 100000000000 (1e11).

	//Non-XRP values have 16 decimal digits of precision, with a maximum value of 9999999999999999e80. The smallest positive non-XRP value is 1e-81

	let buyPriceClean = buyPrice.toFixed(5);	//	For text output only
	let costClean = cost.toFixed(4);	//	For text output only
	
	log(" ");
	log("Placing an order to buy " + shares.toFixed(0) + " XRP at $" + buyPriceClean + " for $" + costClean);
	
	let quantity = shares.toFixed(0), price = buyPrice.toFixed(5);

	console.log('Creating bu8yOrder : ');
	
	/* [CREATE BUY ORDERS] */
	binance.buy("XRPUSDT", quantity, price, {type:'LIMIT'}, (error, response) => {
	  console.info("Limit BUY response", response);

	  if (response.orderId === undefined || response.orderId === null) {
     	console.log('Error executiong BUY order');
	  }else{
	  	buyExecuted = true;
	  	buyOrderID = response.orderId;
		io.emit('orderPriceBuy', orderPriceBuy);		
	  	//minimize delay for pairing trades
	  	sell()

	  }

	});
	
}
function sell()
{
	if(sellExecuted) return;

	let sellPoint = fixedPoint + range;	//	Point at which we sell
	let sellPrice = (sellPoint / XRP);	//	Price of shares when we sell
	orderPriceSell = sellPrice;
	lastTradeRangePercentage = rangePercentage;
	
	let shares = range / sellPrice;	//	Shares to trade
	
	let cost = Number((shares * sellPrice).toFixed(6));	//	Cost for transaction
	tradeValue = parseFloat(cost) * (rangePercentage - 0.002);	//	0.002 is gatehub fee
	
	let sellPriceClean = sellPrice.toFixed(4);	//	For text output only
	let costClean = cost.toFixed(4);	//	For text output only

	log("Placing an order to sell " + shares.toFixed(0) + " XRP at $" + sellPriceClean + " for $" + costClean);

	let quantity = shares.toFixed(0), price = sellPrice.toFixed(5);

	/* [CREATE SELL ORDERS] */
	binance.sell("XRPUSDT", quantity, price, {type:'LIMIT'}, (error, response) => {
	  repeatPrevention = 0;
	  console.info("Limit SELL response", response);

	  if (response.orderId === undefined || response.orderId === null) {
     	console.log('Error executiong SELL order');
	  }else{
	  	sellExecuted = true;
	  	sellOrderID = response.orderId;
	  	io.emit('orderPriceSell', orderPriceSell);
	  }

	});
	
}


function log(message)
{
	let messageWithTime = getDateTime() + ": " + message.toString() + "\n";
	
	if(message == " " || message == "\n")
	{
		messageWithTime = message + "\n";
	}
	
	console.log(messageWithTime);
	io.emit('emit', message);
	
	fs.appendFile('logs/log.txt', messageWithTime, function (err) 
	{
		//if (err) throw err;
		//console.log('Saved priceLogChart!');
	});
}

function startTimer()
{
	startTime = new Date();
	startTime = Math.floor(startTime / 1000);
}

function stopTimer()
{
	stopTime = new Date();
	stopTime = Math.floor(stopTime / 1000);
}

function refresh()
{
	io.emit('pricePerShare', pricePerShare);
	io.emit('USD', cash);
	io.emit('XRP', XRP);
	io.emit('fixedPoint', fixedPoint);
	io.emit('range', range);
	io.emit('salesMultiplier', salesMultiplier);
	io.emit('reserve', reserve);
	io.emit('reserveXRP', reserveXRP);
	io.emit('dayTradeGains', dayTradeGains);
	io.emit('connectionStatus', connection);
	io.emit('reserveMultiplier', reserveMultiplier);
	io.emit('orderPriceBuy', orderPriceBuy);
	io.emit('orderPriceSell', orderPriceSell);
	
	hours();
}

function hours()
{
	let programCurrentTime = new Date();
	programCurrentTime = Math.floor(programCurrentTime / 1000);
	
	let programElapsedTime = programCurrentTime - programStartingTime; 
	programElapsedTime = (programElapsedTime / 3600);
	io.emit('hours', programElapsedTime);
}

function readFiles()
{
	fs.readFile('data/date.txt', function(err, data) 
	{
		programStartingTime = parseInt(data);
		programStartingTime = Math.floor(programStartingTime / 1000);
		console.log(programStartingTime);
	});
	
	fs.readFile('data/dayTradeGains.txt', function(err, data) 
	{
		dayTradeGains = parseFloat(data);
		console.log(dayTradeGains);
	});
	
	fs.readFile('data/totalTransactions.txt', function(err, data) 
	{
		totalTransactions = parseInt(data);
		console.log(totalTransactions);
	});
	
	fs.readFile('data/fixedPoint.txt', function(err, data) 
	{
		fixedPoint = parseFloat(data);
		console.log(fixedPoint);
	});
	
	fs.readFile('data/reserve.txt', function(err, data) 
	{
		reserve = parseFloat(data);
	});
	
	fs.readFile('data/rangePercentage.txt', function(err, data) 
	{
		rangePercentage = parseFloat(data);
		console.log(rangePercentage);
	});
	
	fs.readFile('data/reserveMultiplier.txt', function(err, data) 
	{
		reserveMultiplier = parseFloat(parseFloat(data).toFixed(3));
		console.log(reserveMultiplier);
	});
	
	fs.readFile('data/reserveXRP.txt', function(err, data) 
	{
		reserveXRP = parseFloat(parseFloat(data).toFixed(4));
		console.log(reserveXRP);
	});

	fs.readFile('config/nimble.conf', function(err, data) 
	{
		var conf = data.toString();
		var obj = JSON.parse(conf);

		initialCapital = obj.initial;
		startPrice = obj.startPrice;
		xrpForTrade = obj.xrpTrade;
		availableUSDT = obj.USDT;
	
	});
	
	io.emit('totalTransactions', totalTransactions);
	


}

function readFilesOnce()
{
	fs.readFile('config/apikey.txt', 'utf8', function(err, data) 
	{
		apikey = data;
	});
	
	fs.readFile('config/secret.txt', 'utf8', function(err, data) 
	{
		secret = data;
	});
}

// Only use once
function writeTime()
{
	let getTime = new Date();
	getTime = getTime.getTime();

	console.log("writing time....");

	fs.writeFile('data/date.txt', getTime, function (err) 
	{
		if (err) throw err;
		console.log('Saved!');
	});
}

function writeFiles()
{
	console.log("start to write files here...");

	fs.writeFile('data/dayTradeGains.txt', dayTradeGains, function (err) 
	{
		if (err) throw err;
		console.log('Saved gains!');
	});
	
	fs.writeFile('data/totalTransactions.txt', totalTransactions, function (err) 
	{
		if (err) throw err;
		console.log('Saved transactions count!');
	});
	
	fs.writeFile('data/fixedPoint.txt', fixedPoint, function (err) 
	{
		if (err) throw err;
		console.log('Saved fixedPoint!');
	});
	
	fs.writeFile('data/reserve.txt', reserve, function (err) 
	{
		if (err) throw err;
		console.log('Saved reserve!');
	});
	
	fs.writeFile('data/rangePercentage.txt', rangePercentage, function (err) 
	{
		if (err) throw err;
		console.log('Saved rangePercentage!');
	});
	
	fs.writeFile('data/reserveMultiplier.txt', reserveMultiplier, function (err) 
	{
		if (err) throw err;
		console.log('Saved reserveMultiplier!');
	});
	
	fs.writeFile('data/reserveXRP.txt', reserveXRP, function (err) 
	{
		if (err) throw err;
		console.log('Saved XRP Reserve!');
	});
	
}


function writePriceLog()
{
	let getTime = new Date();
	getTime = getTime.getTime();
	getTime = parseInt(getTime);
	getTime = Math.floor(getTime / 1000);
	getTime = getTime - programStartingTime;
	
	let priceLogLine = (getTime.toString() + ", " + pricePerShare.toString() + ", " + USD.toString() + ", " + marketValue.toString() + ", " + XRP.toString() + ", \n");
	fs.appendFile('logs/priceLog.csv', priceLogLine, function (err) 
	{
		if (err) throw err;
		console.log('Saved priceLogLine!');
	});

	let netWorthValue = (parseFloat(USD) + parseFloat(marketValue));
	netWorthValue = parseFloat(netWorthValue.toFixed(2));

	let priceLogChart = (getTime.toString() + ", " + pricePerShare.toString() + ", " + netWorthValue.toString() + ", \n");
	fs.appendFile('logs/priceLogChart.csv', priceLogChart, function (err) 
	{
		if (err) throw err;
		console.log('Saved priceLogChart!');
	});
}

function writeTimeout()
{
	let getTime = new Date();
	getTime = getTime.getTime();
	fs.writeFile('data/timeOut.txt', getTime, function (err) 
	{
		if (err) throw err;
		console.log('Saved timeout!');
	});
}

//	We make the http server listen on port 3000
http.listen(3000, function()
{
	console.log('listening on *:3000');
});

function updateVariables()
{
	getBalance();

	marketValue = (XRP * pricePerShare);
	
	range = fixedPoint * rangePercentage;

	salesMultiplier = ((fixedPoint / range) / 10000.00);	//	0.01% of fixed point
}

function getBalance()
{
	
	binance.balance((error, balances) => {
	  if ( error ) return console.error(error);
	  //console.info("balances()", balances);
	  
	  //*************XRP BALANCE [START]
	  
	  connection = "Connected";

	  console.info("XRP balance: ", balances.XRP.available);
		
		let resultMessage = "XRP: ";
		
		XRP = balances.XRP.available;
		
		reserveXRP = parseFloat(reserveXRP);
		
		XRP = (XRP - reserveXRP);
		
		resultMessage += XRP;
		console.log(resultMessage);
		console.log(" ");
		io.emit('XRP', XRP);

	  /* XRP BALANCE [END] */				  

	  //USDT BALANCE [START]

		let resultMessage2 = "USD: $";
		USD = balances.USDT.available;
		
		cash = parseFloat(USD);
		
		if(cashOld == 0.00)
		{
			cashOld = cash;
		}
		
		cashDifference = cash - cashOld;
		
		reserve = parseFloat(reserve);
		
		
		cash = (cash - reserve);	

		resultMessage2 += USD;

		counterpartyCalc = (XRP * pricePerShare);

		//counterparty = balances[i].counterparty;
		counterparty = parseFloat(counterpartyCalc).toFixed(2);
		console.log(resultMessage2);

		console.log(" ");
		io.emit('USD', cash);
	  //USDT BALANCE [END]

	});

}

function getDateTime(unit) 
{
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

	if(unit == "hour")
	{
		return hour.toString();
	}
	else if (unit == "min")
	{
		return min.toString();
	}
	else if (unit == "sec")
	{
		return sec.toString();
	}
	else if (unit == "year")
	{
		return year.toString();
	}
	else if (unit == "month")
	{
		return month.toString();
	}
	else if (unit == "day")
	{
		return day.toString();
	}
	else
	{
		return ("[ " + year.toString() + "-" + month.toString() + "-" + day.toString() + " ][ " + hour.toString() + ":" + min.toString() + ":" + sec.toString() + " ]");
	}
}

//https://www.npmjs.com/package/read-last-lines

'use strict';

const Binance = require('node-binance-api');
const binance = new Binance().options({
  APIKEY: '4kLTJMsb7L1OX5QgZawwDou0UeKMjhARJtRGWy3hbQR7dUxM9mOr3B4dQSBHoXrP',
  APISECRET: 'qDgJ0ZQPiY6uQQ3vOUKVbjEnahvJVB7XGjSZBzH6PVyMqqgdc6Lwghh3bWpu7HEG',
  useServerTime: true 
});


/*
binance.depositAddress("XRP", (error, response) => {
  console.info(response);
});
*/

//*****Current Balance of Wallet (XRP)
binance.balance((error, balances) => {
  if ( error ) return console.error(error);
  //console.info("balances()", balances);
  console.info("XRP balance: ", balances.XRP.available);
});

//*****Current Price of Trading Pairs (XRP/BTC)
binance.prices('XRPUSDT', (error, ticker) => {
  console.info("Price of XRP: ", ticker.XRPUSDT);
});

//*****Fetch all open orders
binance.openOrders(false, (error, openOrders) => {
  console.info("openOrders()", openOrders);

  for(var x = 0; x< openOrders.length; x++){
  	var orders = openOrders[x];

  	if(orders.symbol=='XRPUSDT' && orders.side == 'SELL'){ //TODO : CHANGE TO XRPUSDT SYMBOL
  		console.log("is a sale order for " + orders.symbol);
  	}

  }

});

binance.allOrders("XRPUSDT", (error, orders, symbol) => {
  console.info(symbol+" orders:", orders);
  for(var x = 0; x< orders.length; x++){
  	console.log(orders[x].orderId + " [status : " + orders[x].status + " ]");	
  }

});



//*****Open Buy and Sale Order
let quantity = 30, price = 0.55512;

//binance.buy("XRPUSDT", quantity, price);
//binance.sell("XRPUSDT", quantity, price);

/*
binance.sell("XRPUSDT", quantity, price, {type:'LIMIT'}, (error, response) => {
  console.info("Limit SELL response", response);
  console.info("order id: " + response.orderId);
});
*/


/* [OUTPUT RESPONSE]
Limit SELL response { symbol: 'XRPUSDT',
  orderId: 1189307000,
  orderListId: -1,
  clientOrderId: '8z1TnwSNRwSky0pE5sN8iv',
  transactTime: 1607788000473,
  price: '0.55512000',
  origQty: '30.00000000',
  executedQty: '0.00000000',
  cummulativeQuoteQty: '0.00000000',
  status: 'NEW',
  timeInForce: 'GTC',
  type: 'LIMIT',
  side: 'SELL',
  fills: [] }
order id: 1189307000

*/

//******Cancel ALl open orders for trading pairs
//binance.cancelAll("XRPUSDT");

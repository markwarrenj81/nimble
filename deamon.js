'use strict';

var app = require('express')();
var http = require('http').Server(app);
var fs = require('fs');
var cmd = require('node-cmd');
var readTime = 0;
var oldTime = 0;
const assert = require('assert');


init();

setTimeout(readFiles, 180000);

function readFiles()
{
	console.log("Reading files");
	fs.readFile('timeOut.txt', function(err, data) 
	{
		readTime = parseInt(data);
		readTime = Math.floor(readTime / 1000);
		console.log(readTime);
	});
	
	setTimeout(checkTime, 3000);
	
	setTimeout(readFiles, 180000);
}

function checkTime()
{
	if (readTime == oldTime)
	{
		console.log("Time out occured");
		kill();
		setTimeout(start, 1000);
	}
	else
	{
		console.log("Everything looks good");
	}
	oldTime = readTime;
}

function init()
{
	fs.readFile('timeOut.txt', function(err, data) 
	{
		readTime = parseInt(data);
		readTime = Math.floor(readTime / 1000);
		oldTime = readTime;
		console.log(readTime);
	});
}

function kill()
{
	cmd.run('sudo pkill -f "sudo node index.js Reddit"');
}

function start()
{
	cmd.run('sudo node index.js Reddit &');
}
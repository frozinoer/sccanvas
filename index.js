"use strict";

const util = require('util');
const fs = require('fs');
const _ = require('lodash');
const dotenv = require('dotenv');
const moment = require('moment');
moment.locale('fr-FR');

var express = require('express');

var app = express();

const colors = require('colors');

const dotenvResult = require('dotenv').config();
/*if (dotenvResult.error) {
  throw dotenvResult.error
}*/

//const { createCanvas, loadImage } = require('canvas-prebuilt');
const Canvas = require('canvas-prebuilt');
const canvas = new Canvas(640, 335);
const ctx = canvas.getContext('2d');

// Write "Awesome!"
ctx.font = '30px Impact'
ctx.rotate(0.1)
ctx.fillText('Awesome!', 50, 100)

// Draw line under text
var text = ctx.measureText('Awesome!')
ctx.strokeStyle = 'rgba(0,0,0,0.5)'
ctx.beginPath()
ctx.lineTo(50, 102)
ctx.lineTo(50 + text.width, 102)
ctx.stroke();

console.log('<img src="' + canvas.toDataURL() + '" />');


app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));


app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));

});

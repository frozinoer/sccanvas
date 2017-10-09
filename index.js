"use strict";

const _ = require('lodash');
const fs = require('fs')

const express = require('express');

const app = express();


//const { createCanvas, loadImage } = require('canvas-prebuilt');
const Canvas = require('canvas-prebuilt');
const Image = Canvas.Image;

const SquarecountNotification = require('./modules/squarecount-notification');
const transaction = require('./modules/transaction').transaction;

const canvas = new Canvas(640, 335);
const ctx = canvas.getContext('2d');


//console.log('<img src="' + canvas.toDataURL() + '" />');


app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));


app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));

    SquarecountNotification
        .createNotification(canvas, transaction)
        .then(() => {
            let filename = transaction.id + '.png';
            let out = fs.createWriteStream(__dirname + '/' + filename);
            let stream = canvas.pngStream();
            stream.on('data', chunk => {
              out.write(chunk);
            }); 
            stream.on('end', () => {
              console.log(filename + " has been saved");
            });

        })

});

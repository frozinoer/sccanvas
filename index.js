"use strict";

const _ = require('lodash');
const fs = require('fs');
const https = require('https');

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

    let createUserImageFn = (user, resolve, reject) => {
        https.get(user.url, res => {
            let buf = '';
            res.setEncoding('binary');
            res.on('data', chunk => { buf += chunk; });
            res.on('end', () => {
                let image = new Image;
                image.onload = () => {
                    user.image = image;
                    resolve();
                };
                image.onerror = function(err){
                    console.log(err);
                    reject(err);
                };
                image.src = new Buffer(buf, 'binary');
            });
        });
    }

    let getLocalImageFn = (path, resolve, reject) => {
        fs.readFile(__dirname + "/" + path, function(err, content) {
            if (err) {
                reject(err);
            } else {
                let image = new Image;
                image.src = content;
                resolve(image);             
              }
        });

    }

    SquarecountNotification
        .createNotification(canvas, transaction, createUserImageFn, getLocalImageFn)
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

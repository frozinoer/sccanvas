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



/*router.get('/', function (req, res, next) {
    res.render('someView', {msg: 'Express'});
});*/

app.set('port', process.env.PORT || 3000);
app.use(express.static('public'));



app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));

});
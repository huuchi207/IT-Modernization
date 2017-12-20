//express
const express = require('./node_modules/express');
const app = express();
//body-parser
const bodyParser = require('./node_modules/body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

//mongodb driver
const MongoClient = require('./node_modules/mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:3001/meteor';

//assert
const assert = require('assert');

//file system
const fs = require('fs');



app.get('/hourly/:kind', (req, res) => {
    console.log("hourly");
    // res.setHeader("Access-Control-Allow-Origin", "*");
    let date = new Date();
    let hour = date.getHours();

    let year = date.getFullYear();
    let month = date.getMonth() + 1; // beware: January = 0; February = 1, etc.
    let day = date.getDate();
    MongoClient.connect(url, function (err, db) {
        db.collection('data').find(
            {year: year},
            {
                sort: {month: -1, day: -1, hour: -1,}, limit: 12,
                fields: {averageData: 1, hour: 1, day: 1, month: 1, year: 1}
            }
        ).toArray(
            function (err, items) {
                res.header('Access-Control-Allow-Origin', '*');
                res.send(items);
                db.close();
            }
        );

    })
});
app.get('/real-time/:kind', (req, res) => {
    console.log("real-time");
    // res.setHeader("Access-Control-Allow-Origin", "*");
    let date = new Date();
    let hour = date.getHours();

    let year = date.getFullYear();
    let month = date.getMonth() + 1; // beware: January = 0; February = 1, etc.
    let day = date.getDate();
    MongoClient.connect(url, function (err, db) {
        db.collection('data').findOne(
            {year: year, month:month, day:day, hour:hour},
            {
                // fields: {data: 1, hour: 1, day: 1, month: 1, year: 1},
                data: { $slice: -6 },
            }
        ,     function (err, items) {
                res.header('Access-Control-Allow-Origin', '*');
                res.send(items);
                db.close();
            }
        );

    })
});
app.get('/daily/:kind', (req, res) => {
    console.log("daily");
    let kind = req.params.kind;
    // res.setHeader("Access-Control-Allow-Origin", "*");
    let date = new Date();
    let hour = date.getHours();

    let year = date.getFullYear();
    let month = date.getMonth() + 1; // beware: January = 0; February = 1, etc.
    let day = date.getDate();
    MongoClient.connect(url, function (err, db) {
        db.collection('data').find(
            {year: year},
            {
                sort: {month: -1, day: -1, hour: -1,},
                limit: 24 * 7,
                fields: {averageData: 1, hour: 1, day: 1, month: 1, year: 1}
            }
        ).toArray(
            function (err, items) {
                res.header('Access-Control-Allow-Origin', '*');
                var data = [];
                var result = [];
                items.forEach(function (e) {
                    var day = e.day;
                    var month = e.month;
                    var year = e.year;
                    // //console.log("e: " + e.day + "/ " + month + "/ " + year);
                    if (data.indexOf(day) === -1) {
                        data.push(day);
                        result.push({day: day, month: month, year: year});
                        // //console.log("data.indexOf(day) ===-1");
                    }
                })
                result.forEach(function (resultElement) {
                    db.collection('data').find(
                        {year: resultElement.year, month: resultElement.month, day: resultElement.day},
                        {fields: {averageData: 1}}
                    ).toArray(
                        function (error, i) {
                            if (!error) {
                                //console.log(i);
                                var avgTemp = 0;
                                var avgHum = 0;
                                var avgCO = 0;
                                i.forEach(function (el) {
                                    avgTemp += Number(el.averageData.avgTem).toFixed(2);
                                    avgHum += Number(el.averageData.avgHum).toFixed(2);
                                    avgCO += Number(el.averageData.avgCo).toFixed(2);
                                })
                                avgTemp = avgTemp / i.length;
                                avgHum = avgHum / i.length;
                                avgCO = avgCO / i.length;

                                resultElement.avgData = {
                                    avgTemp: avgTemp,
                                    avgHum: avgHum,
                                    avgCO: avgCO
                                }
                            }
                            else {
                                //console.log(error);
                            }
                        }
                    );
                })

                result.forEach(function (resultElement) {
                    var measure = getRandomDoubleInclusive(17, 25);;
                    if (kind === "groundHumidity") {
                        measure = getRandomDoubleInclusive(60, 80);
                    } else if (kind === "co") {
                        measure = getRandomDoubleInclusive(70, 90);
                    }
                    resultElement.data = measure;
                })
                res.send(result);
                //console.log("res.send(result);");
                db.close();
            }
        );

    })
});

const ser = app.listen(3333, function () {
    const host = ser.address().address;
    const port = ser.address().port;

})
function convertStringToFloat(n) {
    return Number(n).toFixed(1);
}
function getRandomDoubleInclusive(min, max) {
    return Number(Math.random() * (max - min) + min).toFixed(2);
}
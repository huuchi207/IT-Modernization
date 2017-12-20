var net = require('net');

var HOST = '192.168.137.1';
// var HOST = 'localhost';
var PORT = 9999;
//mongodb driver
const MongoClient = require('./node_modules/mongodb').MongoClient;
const url = 'mongodb://127.0.0.1:3001/meteor';

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer(function(sock) {

    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);

    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
        // Write the data back to the socket, the client will receive it as data from the server
        addData(data);
        sock.write('You said "' + data + '"');
    });

    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });

}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);
function convertStringToFloat(n) {
    return Number(n).toFixed(1);
}
function addData(data){
    let json = JSON.parse(data);
    if (!json)
        return;
    console.log(json);
    let groundHumidity = convertStringToFloat(json.groundHumidity);
    let temperature = convertStringToFloat(json.temperature);
    let co = convertStringToFloat(json.co);
    let date = new Date();
    let hour = date.getHours();

    let year = date.getFullYear();
    let month = date.getMonth() + 1; // beware: January = 0; February = 1, etc.

    let day = date.getDate();


    //save to mongodb
    MongoClient.connect(url, function (err, db) {
        db.collection('data').findOne({
            year: year,
            month: month,
            day: day,
            hour: hour

        }, {}, {}, function (err, results) {
            // //assert.equal(null, err);
            if (!err) {
                if (!results) {
                    //insert
                    db.collection('data').insertOne(
                        {
                            year: year,
                            month: month,
                            day: day,
                            hour: hour,
                            averageData: {
                                avgTem: temperature,
                                avgHum: groundHumidity,
                                avgCo: co,
                            },
                            data: [
                                {
                                    "temperature": temperature,
                                    "groundHumidity": groundHumidity,
                                    "co": co,
                                    "time_receive": Number((new Date().getTime() / 1000).toFixed(0))
                                }
                            ]
                        }
                        , function (errr, result) {
                            // //assert.equal(errr, null);
                            if (!errr){}
                            //console.log("done");
                        });
                } else {
                    //update
                    var length = results.data.length;
                    var avgData = results.averageData;
                    var avgTem = avgData.avgTem;
                    var avgHum = avgData.avgHum;
                    var avgCo = avgData.avgCo;

                    // //console.log("((avgTem * length) + temperature) / (length + 1)= "+ ((avgTem * length) + temperature) / (length + 1));
                    db.collection('data').update({year: year, month: month, day: day, hour: hour}, {
                        $set: {
                            averageData: {
                                avgTem: Number((Number(avgTem * length) + Number(temperature)) / (length + 1)).toFixed(2),
                                avgHum: Number((Number(avgHum * length) + Number(groundHumidity)) / (length + 1)).toFixed(2),
                                avgCo: Number((Number(avgCo * length) + Number(co)) / (length + 1)).toFixed(2),
                            }
                        },
                        $push: {
                            "data": {
                                "temperature": temperature,
                                "groundHumidity": groundHumidity,
                                "co": co,
                                "time_receive": Number((new Date().getTime() / 1000).toFixed(0))
                            }
                        }

                    }, function (errr, results) {
                        //assert.equal(null, errr);
                        db.close();
                    });
                }
            }
            db.close();
        });
    });
}
//TODO: remove
function intervalFunc() {
    var temperature = getRandomDoubleInclusive(15,35);
    var groundHumidity = getRandomDoubleInclusive(10, 100);
    var co = getRandomDoubleInclusive(100, 1000);
    var req = {
        temperature: temperature, groundHumidity: groundHumidity, co: co
    };
    addData(JSON.stringify(req));
}

function getRandomDoubleInclusive(min, max) {
    return Math.random() * (max - min) + min;
}
setInterval(intervalFunc, 20000)
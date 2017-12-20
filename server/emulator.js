var request = require('./node_modules/request');
const url = 'http://192.168.137.1:9999/data';


function getRandomDoubleInclusive(min, max) {
    return Math.random() * (max - min) + min;
}
function getRandomIntInclusive(min, max) {
    return Number((Math.random() * (max - min) + min).toFixed(0));
}
function intervalFunc() {
    var temperature = getRandomDoubleInclusive(15,35);
    var groundHumidity = getRandomDoubleInclusive(10, 100);
    var co = getRandomDoubleInclusive(100, 1000);
    var req = {
        temperature: temperature, groundHumidity: groundHumidity, co: co
    };
    console.log(req);
    // request.post(url, req)
    request({
        url: url,
        method: 'POST',
        body: req,
        json: true
    }, (error, response, body) => {
        console.log("ok");
        // this.interval = setTimeout(() => { this.sendDataToServer() }, 5000}

    })
}


setInterval(intervalFunc, 5000)
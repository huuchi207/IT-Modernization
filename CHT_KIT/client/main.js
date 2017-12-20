import {Template} from 'meteor/templating';
import {ReactiveVar} from 'meteor/reactive-var';

import './main.html';
// import {Data} from '../imports/api/data.js';
import {SubscribedMail} from '../imports/api/subscribed-mail.js';
import {messageLogError} from '../imports/message/messages-error'
import {messageLogSuccess} from '../imports/message/messages-success'


let temperatureTimeInterval = null;
let humidityTimeInterval = null;
let COTimeInterval = null;
let temperatureChart = null;
let groundHumidityChart = null;
let COChart = null;

const title = 'Hệ thống cảnh báo chỉ số nhiệt độ, độ ẩm đất cho rau củ và cảnh báo nồng độ khí CO cho người dân';
const url = "http://localhost:3333";
Template.measurement.onCreated(function () {
    Session.setDefault("temperatureChartMode", "real-time");
    Session.setDefault("groundHumidityChartMode", "real-time");
    Session.setDefault("COChartMode", "real-time");
})
Template.measurement.onRendered(function () {
    getTemperatureData();
    getGroundHumidityData();
    getCOData();
    // getDataToAlert();
})
Template.measurement.helpers({
    data: function () {
        let data = Data.find({}, {sort: {time_receive: -1}, limit: 6}).fetch();
        let tData = [];
        data.forEach(function (element) {
            tData.push(element.temperature);
            // console.log(element.temperature);
        });
        // console.log(tData);
        // console.log(data);

        return tData;
    }
})
Template.measurement.events({
    'change #temperatureSelection': function (event) {
        event.preventDefault();
        console.log("mode = " + $(event.target).val());
        Session.set("temperatureChartMode", $(event.target).val());
        if (temperatureChart) {
            temperatureChart.destroy();
            temperatureChart = null;
        }
        if (temperatureTimeInterval) {
            clearTimeout(temperatureTimeInterval);
        }
        getTemperatureData();
    }, 'change #groundHumiditySelection': function (event) {
        event.preventDefault();
        console.log("mode = " + $(event.target).val());
        Session.set("groundHumidityChartMode", $(event.target).val());
        if (groundHumidityChart) {
            groundHumidityChart.destroy();
            groundHumidityChart = null;
        }
        if (humidityTimeInterval) {
            clearTimeout(humidityTimeInterval);
        }
        getGroundHumidityData();
    }, 'change #COSelection': function (event) {
        event.preventDefault();
        console.log("mode = " + $(event.target).val());
        Session.set("COChartMode", $(event.target).val());
        if (COChart) {
            COChart.destroy();
            COChart = null;
        }
        if (COTimeInterval) {
            clearTimeout(COTimeInterval);
        }
        getCOData();
    },
    'submit form': function (event) {
        event.preventDefault();
        let email = $('#enterMail').val();
        console.log(email);
        if (!validateEmail(email)) {
            messageLogError("Email sai định dạng. Mời nhập lại!");
            return;
        }

        Meteor.call("subscribedMail.insert", email);
        Meteor.call(
            'sendEmail',
            email,
            'chtkit2017@gmail.com',
            title,
            'Cảm ơn bạn đã đăng kí nhận thông báo từ chúng tôi.'
        );
        $('#enterMail').val('');
        messageLogSuccess("Đăng kí thành công.");
    },'click #test':function () {
        $('#slaveInfoModal').modal('show');
    }
})

function drawTemperatureChart(result, type) {
    //build color and label based on data and type
    let labels = [];
    let colors = [];
    let data = [];
    if (type === "real-time") {
        result.data.forEach(function (e) {
            data.push(e.temperature);
            colors.push(getColorByTemp(e.temperature));
            labels.push(getLabelForRealtimeMode(e.time_receive));
        })
    } else if (type === "daily") {
        result.reverse();
        result.forEach(function (e) {
            data.push(e.data);
            colors.push(getColorByTemp(e.temperature));
            labels.push(getLabelForDailyMode(e.day, e.month, e.year));
        })
    } else {
        result.reverse();
        result.forEach(function (e) {
            data.push(e.averageData.avgTem);
            colors.push(getColorByTemp(e.averageData.avgTem));
            labels.push(getLabelForHourlyMode(e.hour, e.day, e.month));
        })
    }

    if (temperatureChart) {
        updateTemperatureChart(data, colors, labels, type);
        return;
    }
    // console.log("temp data: "+ data);
    let ctx = document.getElementById("temperatureCanvas").getContext('2d');
    temperatureChart = new Chart(ctx, {
        type: 'bar',
        // dataPointWidth: 2,
        data: {
            labels: labels,
            datasets: [{
                // label: ,
                data: data,
                // fakedata: fakedata,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],

            },

            // 2 dong nay de reponsive chart vao the div block...
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem) {
                        return tooltipItem.yLabel;
                    }
                }
            }
        }
    });
}
function drawGroundHumidityChart(result, type) {
    //build color and label based on data and type
    let labels = [];
    let colors = [];
    let data = [];
    if (type === "real-time") {
        result.data.forEach(function (e) {
            data.push(e.groundHumidity);
            colors.push(getColorByHum(e.groundHumidity));
            labels.push(getLabelForRealtimeMode(e.time_receive));

        })
    } else if (type === "daily") {
        result.reverse();
        result.forEach(function (e) {
            data.push(e.data);
            colors.push(getColorByHum(e.data));
            labels.push(getLabelForDailyMode(e.day, e.month, e.year));
        })
    } else {
        result.reverse();
        result.forEach(function (e) {
            data.push(e.averageData.avgHum);
            colors.push(getColorByHum(e.averageData.avgHum));
            labels.push(getLabelForHourlyMode(e.hour, e.day, e.month));
        })
    }

    if (groundHumidityChart) {
        updateGroundHumidityChart(data, colors, labels, type);
        return;
    }
    // console.log("hum data: "+ data);
    let ctx = document.getElementById("groundHumidityCanvas").getContext('2d');
    groundHumidityChart = new Chart(ctx, {
        type: 'bar',
        // dataPointWidth: 2,
        data: {
            labels: labels,
            datasets: [{
                label: 'Độ ẩm đất(%)',
                data: data,
                // data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],

            },
            // 2 dong nay de reponsive chart vao the div block...
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem) {
                        return tooltipItem.yLabel;
                    }
                }
            }
        }
    });
}
function drawCOChart(result, type) {
    //build color and label based on data and type
    let labels = [];
    let colors = [];
    let data = [];
    if (type === "real-time") {
        result.data.forEach(function (e) {
            data.push(e.co);
            colors.push(getColorByCO(e.co));
            labels.push(getLabelForRealtimeMode(e.time_receive));

        })
    } else if (type === "daily") {
        result.reverse();
        result.forEach(function (e) {
            data.push(e.data);
            colors.push(getColorByCO(e.data));
            labels.push(getLabelForDailyMode(e.day, e.month, e.year));
        })
    } else {
        result.reverse();
        result.forEach(function (e) {
            data.push(e.averageData.avgCo);
            colors.push(getColorByCO(e.averageData.avgCo));
            labels.push(getLabelForHourlyMode(e.hour, e.day, e.month));
        })
    }
    if (COChart) {
        updateCOChart(data, colors, labels, type);
        return;
    }
    // console.table("co data: "+ data);
    let ctx = document.getElementById("COCanvas").getContext('2d');
    COChart = new Chart(ctx, {
        type: 'bar',
        // dataPointWidth: 2,
        data: {
            labels: labels,
            datasets: [{
                label: 'Nồng độ khí CO(PPM)',
                data: data,
                // data: data,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }],

            },

            // 2 dong nay de reponsive chart vao the div block...
            responsive: true,
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            tooltips: {
                callbacks: {
                    label: function(tooltipItem) {
                        return tooltipItem.yLabel;
                    }
                }
            }
        }
    });
}
function validateEmail(email) {
    let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
function updateTemperatureChart(data, colors, labels) {
    temperatureChart.data.datasets[0].data = data;
    temperatureChart.data.datasets[0].backgroundColor = colors;
    temperatureChart.data.labels = labels;
    temperatureChart.update();
}
function updateGroundHumidityChart(data, colors, labels) {
    groundHumidityChart.data.datasets[0].data = data;
    groundHumidityChart.data.datasets[0].backgroundColor = colors;
    groundHumidityChart.data.labels = labels;
    groundHumidityChart.update();
}
function updateCOChart(data, colors, labels) {
    COChart.data.datasets[0].data = data;
    COChart.data.datasets[0].backgroundColor = colors;
    COChart.data.labels = labels;
    COChart.update();
}

function getTemperatureData() {
    let mode = Session.get("temperatureChartMode");
    let time = 20000;
    if (mode !== "real-time") {
        time = 60000 * 60;
    }
    $.ajax({
        type: "GET",
        url: `${url}/${mode}/temperature`,
        // dataType : 'json',
        success: function (result) {
            drawTemperatureChart(result, mode);
            console.log(`show data : ${result}`);
            temperatureTimeInterval = setTimeout(() => {
                getTemperatureData();
            }, time);
        }
    });
}
function getGroundHumidityData() {
    let mode = Session.get("groundHumidityChartMode");
    let time = 20000;
    if (mode !== "real-time") {
        time = 60000 * 60;
    }
    $.ajax({
        type: "GET",
        url: `${url}/${mode}/groundHumidity`,
        // dataType : 'json',
        success: function (result) {
            drawGroundHumidityChart(result, mode);
            console.log(`show data : ${result}`);
            humidityTimeInterval = setTimeout(() => {
                getGroundHumidityData();
            }, time);
        }
    });
}
function getCOData() {
    let mode = Session.get("COChartMode");
    let time = 20000;
    if (mode !== "real-time") {
        time = 60000 * 60;
    }
    $.ajax({
        type: "GET",
        url: `${url}/${mode}/co`,
        // dataType : 'json',
        success: function (result) {
            drawCOChart(result, mode);
            console.log(`show data : ${result}`);
            COTimeInterval = setTimeout(() => {
                getCOData();
            }, time);
        }
    });
}
function getColorByTemp(t) {
    if (t>35){
        return 'red';
    }else if (t>27){
        return "yellow";
    }else if (t<10) {
        return "gray";
    }
    return "#009966";
}
function getColorByHum(t) {
    if (t>80){
        return "yellow";
    }else if (t<60){
        return "gray";
    }
    return "#009966"
}
function getColorByCO(t) {
    if (t >12800){
        return "#BF0D00";
    }
    else if (t>6400){
        return "#B11707";
    }
    else if (t>3200){
        return "#A3210E";
    }
    else if (t>1600){
        return "#962B15";
    }
    else if (t>1000){
        return "#88351D";
    }
    else if (t>800){
        return "#7A3F24";
    }
    else if (t>400){
        return "#6D492B";
    }
    else if (t>200){
        return "#5F5333";
    }
    else if (t>125){
        return "#515D3A";
    }
    else if (t>100){
        return "#446741";
    }
    else if (t>50){
        return "#367148";
    }
    else if (t>25){
        return "#287B50";
    }
    else if (t>24){
        return "#1B8557";
    }
    else if (t>9){
        return "#0D8F5E";
    }
    return "#009966";
}
function getLabelForRealtimeMode(t) {
    let date = new Date(Number(t) * 1000);
    let hour = date.getHours() >= 10 ? date.getHours() : ("0" + date.getHours());
    console.log("hour = " + hour);
    let m = date.getMinutes() >= 10 ? date.getMinutes() : ("0" + date.getMinutes());
    let s = date.getSeconds() >= 10 ? date.getSeconds() : ("0" + date.getSeconds());
    return hour + ":" + m + ":" + s;
}
function getLabelForHourlyMode(h, day, month) {
    h = h+"h";
    day = day >= 10 ? day : ("0" + day);
    month = month >= 10 ? month : ("0" + month);
    return h + " " + day + "/" + month;
}
function getLabelForDailyMode(day, month, year) {
    year = year >= 10 ? year : ("0" + year);
    day = day >= 10 ? day : ("0" + day);
    month = month >= 10 ? month : ("0" + month);
    return day  + "/" + month + "/" + year;
}

import {Meteor} from 'meteor/meteor';
import '../imports/api/subscribed-mail.js';
import {SubscribedMail}from '../imports/api/subscribed-mail.js';
const url = "http://localhost:3333";
const title = 'Hệ thống cảnh báo chỉ số nhiệt độ, độ ẩm đất cho rau củ và cảnh báo nồng độ khí CO cho người dân';
import {BrowserNotifications} from "../imports/api/pushNotification";
Meteor.startup(() => {
    // code to run on server at startup
    getDataToAlert();
});

function getDataToAlert() {
    console.log("getDataToAlert");
    //temperature and humidity
    getHumidityAndTemperatureDataToAlert();
    getCODataToAlert();
}

function getHumidityAndTemperatureDataToAlert() {
    HTTP.call('get',`${url}/hourly/groundHumidity`, {}, function (err, result) {
        if (!err) {
            // console.log(result.data);
            let data = result.data[0].averageData;
            checkHumidityAndTemperatureThresholdAndSendMail(data.avgTem, data.avgHum);
            // console.log(`show data : ${result}`);
            setTimeout(() => {
                getHumidityAndTemperatureDataToAlert();
            }, 60000 * 30);
        }
        else{
            console.log(err);
        }
        // do something with the result.
    });

}
function getCODataToAlert() {
    HTTP.call('get',`${url}/hourly/co`, {}, function (err, result) {
        if (!err) {
            // console.log(result.content);
            // let data = result[0].averageData;
            checkPPMThresholdAndSendMail(result.data[0].averageData.avgCo);
            // console.log(result[0].averageData.avgCo);
            setTimeout(() => {
                getCODataToAlert();
            }, 60000 * 30);
        }else{
            console.log(err);
        }
        // do something with the result.
    });
}

function checkHumidityAndTemperatureThresholdAndSendMail(t, h) {
    console.log("checkHumidityAndTemperatureThresholdAndSendMail " + t + " /" + h);
    let message = null;
    if (t > 27 && h < 60) {
        message = "Nhiệt độ hiện tại: " + t + " độ C, độ ẩm đát: " + h + ". Hãy chú ý tưới cây."
    }
    else if (t > 35 && h > 80) {
        message = "Nhiệt độ hiện tại: " + t + " độ C, độ ẩm đát: " + h + ". Hãy chú ý che chắn cây trồng."
    }
    else if (t > 35 && h < 60) {
        message = "Nhiệt độ hiện tại: " + t + " độ C, độ ẩm đát: " + h + ". Hãy chú ý che chắn cây trồng và tích cực tưới cây.";
    }
    else if (t < 10 && h < 60) {
        message = "Nhiệt độ hiện tại: " + t + " độ C, độ ẩm đát: " + h + ". Hãy chú ý giữ ấm cho cây trồng và tích cực tưới cây.";
    } else if (t < 10 && h > 60) {
        message = "Nhiệt độ hiện tại: " + t + " độ C, độ ẩm đát: " + h + ". Hãy chú ý giữ ấm cho cây trồng.";
    }
    if (!message)
        return;
    console.log("message = " + message);
    //send noti
    BrowserNotifications.sendNotification({
        title: title,
        icon: '',
        body: message,
        audio: '/audio/coins.mp3',
        url: Meteor.absoluteUrl(),
        onClick: function () {
            // window.focus();
            window.open(Meteor.absoluteUrl());
            this.close();
        }
    })
    //send mail
    let listMail = SubscribedMail.find({});
    listMail.forEach(function (e) {
        Meteor.call(
            'sendEmail',
            e.email,
            'chtkit2017@gmail.com',
            title,
            message
        );
    })

}
function checkPPMThresholdAndSendMail(t) {
    console.log("checkPPMThresholdAndSendMail = " + t);
    let message = null;
    if (t > 1000) {
        message = "Nồng độ khí CO hiện tại là: " + t + ". Mức độ nguy hiểm. Hãy rời khỏi đây ngay lập tức."
    }
    else if (t > 100) {
        message = "Nồng độ khí CO hiện tại là: " + t + ". Mức độ không an toàn. Hãy xem xét lại môi trường xung quanh bạn và đeo khẩu trang vào.";
    }
    else if (t>50) {
        message = "Nồng độ khí CO hiện tại là: " + t + ". Phơi nhiễm tối đa cho phép tại nơi làm việc";
    }
    console.log("message = " + message);
    if (!message)
        return;
    //send noti
    BrowserNotifications.sendNotification({
        title: title,
        icon: '',
        body: message,
        audio: '/audio/coins.mp3',
        url: Meteor.absoluteUrl(),
        onClick: function () {
            // window.focus();
            window.open(Meteor.absoluteUrl());
            this.close();
        }
    })
    //send mail
    let listMail = SubscribedMail.find({});
    listMail.forEach(function (e) {
        Meteor.call(
            'sendEmail',
            e.email,
            'chtkit2017@gmail.com',
            title,
            message
        );
    })

}
import { Mongo } from 'meteor/mongo';

// var BrowserNotifications;

export const  BrowserNotifications = new Mongo.Collection('browserNotifications');

if (Meteor.isServer) {
    BrowserNotifications.sendNotification = function(opts) {
        var id;
        id = BrowserNotifications.insert({
            title: opts.title,
            body: opts.body,
            icon: opts.icon,
            audio: opts.audio,
            url: opts.url
        }, function (error, success) {
            if (error) {
                // console.log('Error sendNotification');
            } else if (success) {
                // console.log('Success sendNotification');
            }
        });
        return Meteor.setTimeout(function() {
            return BrowserNotifications.remove(id);
        }, 5000);
    };
    Meteor.publish('browsernotifications', function() {
        return BrowserNotifications.find();
    });
    BrowserNotifications.allow({
        insert: function() {
            return false;
        },
        update: function() {
            return false;
        },
        remove: function( doc) {
            return false;
        }
    });
}

if (Meteor.isClient) {
    Meteor.subscribe('browsernotifications');
    BrowserNotifications.find().observe({
        added: function(doc) {
            var date = new Date();
            var audio = new Audio();
            audio.src = doc.audio;
            audio.load();
            audio.play();
            Notification.requestPermission(function(p) {
                return new Notification(doc.title, {
                    body: doc.body,
                    icon: doc.icon,
                    dir: "auto",
                    lang: "vi",
                    tag: "job-" + date.getTime(),
                }).onclick = function(event) {
                    event.preventDefault(); // prevent the browser from focusing the Notification's tab
                    window.open(doc.url, '_blank');
                    this.close();
                };
            });
            
            return BrowserNotifications.remove(doc._id);
        }
    });
}
/**
 * Created by mywill on 25/11/17.
 */
import {Mongo} from 'meteor/mongo';

export const SubscribedMail = new Mongo.Collection('subscribedMail');

if (Meteor.isServer) {
    // This code only runs on the server
    Meteor.publish('SubscribedMail', function tasksPublication() {
        return SubscribedMail.find();
    });
} else {
    Meteor.subscribe("SubscribedMail");
}

Meteor.methods({
    'subscribedMail.insert'(email) {
        SubscribedMail.insert({
            email: email,
            created_time: new Date()
        })
    }
})
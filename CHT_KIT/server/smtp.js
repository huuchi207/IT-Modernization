import { Email } from 'meteor/email'
Meteor.startup(function() {
	smtp = {
		username: "chtkit2017@gmail.com", // eg: server@gentlenode.com
		password: "abcd1234A@", // eg: 3eeP1gtizk5eziohfervU
		server: "smtp.gmail.com", // eg: mail.gandi.net
		port: 587
	};

	process.env.MAIL_URL =
		"smtp://" +
		encodeURIComponent(smtp.username) +
		":" +
		encodeURIComponent(smtp.password) +
		"@" +
		encodeURIComponent(smtp.server) +
		":" +
		smtp.port;

});
// Server: Define a method that the client can call.
Meteor.methods({
    sendEmail(to, from, subject, text) {
        // Make sure that all arguments are strings.
        // check([to, from, subject, text], [String]);
        // Let other method calls from the same client start running, without
        // waiting for the email sending to complete.
        this.unblock();
        Email.send({ to, from, subject, text });
    }
});
// https://gist.github.com/LeCoupa/9879221
// https://github.com/selaias/meteor-accounts-entry-flowrouter
// https://github.com/meteor-useraccounts/flow-routing


exports.messageLogError = function ($message, $effect = 'flip', $position = 'top', $timeout = 5000) {
    Meteor.startup(function () {
        var options = {
            effect: $effect,
            position: $position,
            timeout: $timeout,
            onRouteClose: false,
            stack: false,
            offset: '0'
        };
        sAlert.error($message,options);
    });
};

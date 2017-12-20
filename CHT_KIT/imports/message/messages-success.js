exports.messageLogSuccess = function ($message, $effect = 'flip', $position = 'bottom', $timeout = 5000) {
    Meteor.startup(function () {
        var options = {
            effect: $effect,
            position: $position,
            timeout: $timeout ,
            onRouteClose: false,
            stack: false,
            offset: '0'
        };
        sAlert.success($message,options);
    });
};

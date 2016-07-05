'use strict';
var app = require('./lib');

var options = {
    owner_id: "",
    bot_token: "",
    bot_app_id: "",
    commands: {
        prefix: "!",
        deny_blank_perms: false
    },
    twitter: {
        consumer_key: "",
        consumer_secret: "",
        access_token_key: "",
        access_token_secret: ""
    },
    mongodb_uri: "",
    battle_net_tag: ""
};

app = new app(options);

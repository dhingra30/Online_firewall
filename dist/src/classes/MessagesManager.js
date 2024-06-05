const Message = require("./Message");
const util    = require("../util");

class MessagesManager {
    constructor(key) {
        this.key = key;
        this.msgs = [];

        this._upDownCurPlace = 0;

        this._loadHistory();
    }

    _loadHistory() {
        const history = JSON.parse(window.localStorage.getItem(this.key));

        if (history) {
            for (var i in history) {
                var m = history[i];
                this.msgs.push(new Message(m.author, m.message, m.timestamp));
            }
        }
    }

    _getUserMsgs() {
        var msgs = [];
        for (var i = 0; i < this.msgs.length; i++) {
            var m = this.msgs[i];
            if (m.author !== "bash" && m.author !== "console") {
                msgs.push(m);
            }
        }
        return msgs;
    }

    upDownUserMsg(keyCode) {
        var visited = 0;

        var userMsgs = this._getUserMsgs();

        for (var i = userMsgs.length - 1; i >= 0; i--) {

            visited++;

            if (keyCode === util.keyCodes.ARROW_UP) {

                if (visited > this._upDownCurPlace) {
                    this._upDownCurPlace++;
                    return userMsgs[i];
                }


            } else if (keyCode === util.keyCodes.ARROW_DOWN) {
                if (this._upDownCurPlace < 2) {
                    // empty msg
                    this._upDownCurPlace = 0;
                    return;
                }
                if (visited === this._upDownCurPlace) {
                    // return the previous
                    this._upDownCurPlace--;
                    return userMsgs[i + 1];
                }
            } else {
                // shouldn't be getting here!
                console.log("GTFO");
            }

        }

        // only case when it gets here is if we were already at the last place.
        // return first msg
        return userMsgs[0];
    }

    add(msg) {
        this.msgs.push(msg);
        this._upDownCurPlace = 0;
    }

    save() {
        window.localStorage.setItem(this.key, JSON.stringify(this.msgs));
    }

    delete() {
        this.msgs = [];
        window.localStorage.setItem(this.key, "");
    }
}

module.exports = MessagesManager;
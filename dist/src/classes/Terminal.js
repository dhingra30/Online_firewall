const IpTable           = require("./IpTable");
const FileSaver         = require('file-saver');
const MessagesManager   = require("./MessagesManager");
const Message           = require("./Message");
const util              = require("../util");

class Terminal {
    constructor(elem, userName, cmdProcessor) {
        this.terminal       = elem;
        this._id            = elem.attr('id');
        this.elem_messages  = elem.find('.messages');
        this.elem_input     = elem.find('input');
        this.msgManager     = new MessagesManager(this._id);
        this.user_name      = userName;
        this.cmdProcessor   = cmdProcessor;

        this._init();
    }

    _init() {
        this._loadHistory();
        if (localStorage.getItem(this._id + "Ip") === null)
            this.ip = util.randomIp();
        else
            this.ip = localStorage.getItem(this._id + "Ip");

        this.elem_input.keyup((event) => this._listener(event));
        $('#' + this._id + 'File').change((event) => this._rulesUpload(event));
        $('#' + this._id + 'Download').click((event) => this._rulesDownload(event));

        this.changeUser(this.user_name);

        // iptables
        this.ipTable = new IpTable(this._id + "Rule");
    }

    _rulesUpload(event) {
        var f = event.target.files[0];
        var reader = new FileReader();
        reader.terminal = this;
        reader.onload = (function(reader)
        {
            return function()
            {
                reader.terminal.ipTable.resetRules();
                var contents = reader.result.split('\n');
                contents.forEach(function(line) {
                    if (line.trim().substr(0, 2) !== "##") {
                        reader.terminal.cmdProcessor.process(reader.terminal, line);
                    }
                });
                reader.terminal.cmdProcessor.process(reader.terminal, "iptables -L");
            };
        })(reader);
        reader.readAsText(f);
    }

    _rulesDownload(event) {
        const rules = this.ipTable.rules;
        var toSave = [];
        rules.forEach(function(rule) {
           toSave.push(rule.saveString);
        });
        var blob = new Blob([toSave.join('\n')], {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(blob, ((this._id === "i") ? "insider" : "ousider") + ".rules");
    }

    changeOtherTerminal(terminal) {
        this.otherTerminal = terminal;
    }

    changeUser(name) {
        this.user_name = name;
        this.terminal.find('.name').text(name + ":");
    }

    clearMessages() {
        this.elem_messages.html("");
    }

    _loadHistory() {
        if (!this.msgManager.msgs) return;

        this.msgManager.msgs.forEach((msg) => {
            this._append(msg);
        });
    }

    add(message) {
        this.msgManager.add(message);
        this._append(message);
    }

    _append(message) {
        this.elem_messages.append('<p>' + message.toString() + '</p>');
    }

    deleteMsgs() {
        this.msgManager.delete();
        this.clearMessages();
    }

    _listener(event) {
        var msg;
        switch (event.keyCode) {
            case (util.keyCodes.RETURN):
                msg = this.elem_input.val();

                msg = new Message(this.user_name, msg);
                this.add(msg);
                this.cmdProcessor.process(this, msg.message);
                this.elem_input.val("");
                this.msgManager.save();
                break;

            case (util.keyCodes.ARROW_UP):
            case (util.keyCodes.ARROW_DOWN):
                msg = this.msgManager.upDownUserMsg(event.keyCode);
                this.elem_input.val(typeof msg !== "undefined" ? msg.message : "");
                break;
        }
    }

    saveIp() {
        window.localStorage.setItem(this._id + "Ip", this.ip);
    }
}


module.exports = Terminal;
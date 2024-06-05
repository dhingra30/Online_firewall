const CommandsProcessor     = require("./classes/CommandsProcessor");
const Terminal              = require("./classes/Terminal");

const cmdProcessor = new CommandsProcessor();

const term_o = new Terminal($('#o'), "outsider", cmdProcessor);
const term_i = new Terminal($('#i'), "insider" , cmdProcessor);

term_o.otherTerminal = term_i;
term_i.otherTerminal = term_o;

window.onbeforeunload = function() {
    term_o.saveIp();
    term_i.saveIp();
    term_o.msgManager.save();
    term_i.msgManager.save();
    term_o.ipTable.save();
    term_i.ipTable.save();
};


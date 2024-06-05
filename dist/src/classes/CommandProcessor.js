const Message       = require("./Message");
const util          = require("../util");
const rule          = require("./ipTableRule");

class CommandsProcessor {
    static tokenise(msg) {
        return msg.split(" ");
    }


    static isValidIpv4(token) {
        const chunks = token.split('.');
        for (let c of chunks) {
            if (!c.match(/^[0-9\/]+$/i))
                return false;
            if (c < 0 || c > 255)
                return false;
        }
        return true;
    }

    findToken(msg, flag, regexps) {
        var regexpExec = flag + '\\s';
        var i = 0;

        // determine initial positions (ie. input: flag: -I { chain: "\\w+", position: "\\w+" } => { chain: 0, position: 1 }
        // and generate regexp, e.g. "-I\s(\w+)\s(\w+)\s"
        for (var regexp in regexps) {
            if (!regexps.hasOwnProperty(regexp)) continue;
            regexpExec += '(' + regexps[regexp] + ')\\s';
            regexps[regexp] = i;
            i++;
        }

        // remove trailing \\s, ie. "-I\s(\w+)\s(\w+)\s" => "-I\s(\w+)\s(\w+)"
        regexpExec = regexpExec.substr(0, regexpExec.length - 2);

        // e.g. "iptables -I INPUT 4 hello" => ["-I INPUT 4", "INPUT", "4"]
        const matches =  new RegExp(regexpExec, 'g').exec(msg);

        if (!matches)
            return {found: false};

        // re-assign to original property, ie. chain: INPUT, position: 4
        for (i = 1; i < matches.length; i++)
            regexps[Object.keys(regexps).find(key => regexps[key] === i - 1)] = matches[i];

        // marges objects
        return Object.assign({found: true}, regexps);

    }

    error() {
        if (this.terminal === undefined)
            return { action: "error" };
        this.terminal.add(new Message("bash","Invalid rule."));
        return { action: "error" };
    }

    processIpRule(msg) {
        var newRule = rule();
        newRule.saveString(msg);
        
        const word = "\\w+";

        const fEmpty    = this.findToken(msg, "-F",       {}                                );
        const f         = this.findToken(msg, "-F",       { chain: word }                   );
        const a         = this.findToken(msg, "-A",       { chain: word }                   );
        const i         = this.findToken(msg, "-I",       { chain: word, position: word}    );
        const d         = this.findToken(msg, "-D",       { chain: word, position: word}    );
        const s         = this.findToken(msg, "-s",       { sourceAddr: "[\\.|\\/|\\w]+"}   );
        const p         = this.findToken(msg, "-p",       { protocol: word }                );
        const j         = this.findToken(msg, "-j",       { jump: word }                    );
        const dport     = this.findToken(msg, "--dport",  { port: word }                    );

        // build up rule
        if (a.found)
            newRule.chain(a.chain);
        if (i.found)
            newRule.chain(i.chain);
        if (s.found)
            newRule.source(s.sourceAddr);
        if (p.found) {
            if (p.protocol === "tcp" || p.protocol === "udp" || p.protocol === "all")
                newRule.protocol(p.protocol);
            else
                this.error();
        }
        if (j.found)
            newRule.jump(j.jump);
        if (dport.found) {
            if (dport.port in util.dports)
                newRule.port(util.dports[dport.port]);
            else if (dport.port > 0 && dport.port < 65535)
                newRule.port(dport.port);
            else
                this.error();
        }
        if (this.terminal === undefined)
            return newRule.build();

        if (f.found)
            this.terminal.ipTable.resetChain(f.chain);
        else if (fEmpty.found)
            this.terminal.ipTable.resetRules();
        else if (a.found)
            this.terminal.ipTable.addRule(newRule.build());
        else if (i.found)
            this.terminal.ipTable.insertRule(i.chain, i.position, newRule.build());
        else if (d.found)
            this.terminal.ipTable.deleteRule(d.chain, d.position);
        else
            this.error();
    }

    processNmap(tokens) {
        // our version requires "nmap -p <port> <address>"
        if (tokens.length !== 4)
            return this.error();

        const sourceAddr = this.terminal.ip;
        const port = tokens[2];
        var targetTerminal;
        if (this.terminal.user_name === tokens[3] || this.terminal.ip === tokens[3])
            targetTerminal = this.terminal;
        else if (this.terminal.otherTerminal.user_name === tokens[3] || this.terminal.otherTerminal.ip === tokens[3])
            targetTerminal = this.terminal.otherTerminal;
        else
            return this.terminal.add(new Message("bash", "Target ip address not known."));

        if (targetTerminal.ipTable.isPortOpened(port, sourceAddr))
            return this.terminal.add(new Message("console", "Port " + port +" at IP: " + targetTerminal.ip + " is opened."));
        else
            return this.terminal.add(new Message("console", "Port " + port +" at IP: " + targetTerminal.ip + " is closed."));
    }

    process(terminal, msg) {
        this.terminal = terminal;
        const tokens = CommandsProcessor.tokenise(msg);

        if (tokens[0] === "iptables") {
            if (tokens[1] === "-L") {
                // display current rules
                for (let r of terminal.ipTable.listRules()) {
                    terminal.add(new Message("console", r));
                }
            } else {
                this.processIpRule(msg);
            }
            return;
        } else if (tokens[0] === "nmap") {
            this.processNmap(tokens);
            return;
        } else if (tokens[0] === "set" && tokens[1] === "ip") {
            if (CommandsProcessor.isValidIpv4(tokens[2]))
                terminal.ip = tokens[2];
            else
                terminal.add(new Message("console", "Invalid IPv4 address: " + tokens[2]));
            return;
        }

        switch (msg) {
            case "":
                break;
            case "del msgs":
                terminal.deleteMsgs();
                break;
            case "clear":
                terminal.clearMessages();
                break;
            case "save msgs":
                terminal.msgManager.save();
                break;
            case "ipconfig":
                terminal.add(new Message("console", "Your ip: " + terminal.ip));
                break;
            default:
                terminal.add(new Message("bash", msg + ": Command not known."));
                break;
        }
    }

}

module.exports = CommandsProcessor;
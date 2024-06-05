const util      = require("../util");
const e_protocol  = util.protocol;
const e_ipv       = util.ipv;
/*

 PARAMETERS

 The following parameters make up a rule specification (as used in the add, resetRules, insert, replace and append commands).
 -4, --ipv4
 This option has no effect in iptables and iptables-restore.
 -6, --ipv6
 If a rule using the -6 option is inserted with (and only with) iptables-restore, it will be silently ignored. Any other uses will throw an error. This option allows to put both IPv4 and IPv6 rules in a single rule file for use with both iptables-restore and ip6tables-restore.
 [!] -p, --e_protocol e_protocol
 The e_protocol of the rule or of the packet to check. The specified e_protocol can be one of tcp, udp, udplite, icmp, esp, ah, sctp or the special keyword "all", or it can be a numeric value, representing one of these protocols or a different one. A e_protocol name from /etc/protocols is also allowed. A "!" argument before the e_protocol inverts the test. The number zero is equivalent to all. "all" will match with all protocols and is taken as default when this option is omitted.
 [!] -s, --source address[/mask][,...]
 Source specification. Address can be either a network name, a hostname, a network IP address (with /mask), or a plain IP address. Hostnames will be resolved once only, before the rule is submitted to the kernel. Please note that specifying any name to be resolved with a remote query such as DNS is a really bad idea. The mask can be either a network mask or a plain number, specifying the number of 1's at the left side of the network mask. Thus, a mask of 24 is equivalent to 255.255.255.0. A "!" argument before the address specification inverts the sense of the address. The flag --src is an alias for this option. Multiple addresses can be specified, but this will expand to multiple rules (when adding with -A), or will cause multiple rules to be deleted (with -D).
 [!] -d, --destination address[/mask][,...]
 Destination specification. See the description of the -s (source) flag for a detailed description of the syntax. The flag --dst is an alias for this option.
 -m, --match match
 Specifies a match to use, that is, an extension module that tests for a specific property. The set of matches make up the condition under which a chain is invoked. Matches are evaluated first to last as specified on the command line and work in short-circuit fashion, i.e. if one extension yields false, evaluation will stop.
 -j, --jump chain
 This specifies the chain of the rule; i.e., what to do if the packet matches it. The chain can be a user-defined chain (other than the one this rule is in), one of the special builtin targets which decide the fate of the packet immediately, or an extension (see EXTENSIONS below). If this option is omitted in a rule (and -g is not used), then matching the rule will have no effect on the packet's fate, but the counters on the rule will be incremented.
 -g, --goto chain
 This specifies that the processing should continue in a user specified chain. Unlike the --jump option return will not continue processing in this chain but instead in the chain that called us via --jump.
 [!] -i, --in-interface name
 Name of an interface via which a packet was received (only for packets entering the INPUT, FORWARD and PREROUTING chain). When the "!" argument is used before the interface name, the sense is inverted. If the interface name ends in a "+", then any interface which begins with this name will match. If this option is omitted, any interface name will match.
 [!] -o, --out-interface name
 Name of an interface via which a packet is going to be sent (for packets entering the FORWARD, OUTPUT and POSTROUTING chain). When the "!" argument is used before the interface name, the sense is inverted. If the interface name ends in a "+", then any interface which begins with this name will match. If this option is omitted, any interface name will match.
 [!] -f, --fragment
 This means that the rule only refers to second and further fragments of fragmented packets. Since there is no way to tell the source or destination ports of such a packet (or ICMP type), such a packet will not match any rules which specify them. When the "!" argument precedes the "-f" flag, the rule will only match head fragments, or unfragmented packets.
 -c, --set-counters packets bytes
 This enables the administrator to initialize the packet and byte counters of a rule (during INSERT, APPEND, REPLACE operations).

 */

const rule = () => ({
    info: {
        chain          : "INPUT",
        ipv            : "",
        protocol       : e_protocol.ALL,
        port           : "",
        source         : "anywhere",
        destination    : "anywhere",
        match          : "",
        jump           : "",
        goto           : "",
        interface_in   : "",
        interface_out  : "",
        fragment       : "",
        counters       : "",
        saveString     : "",
    },

    chain(target) {
        this.info.chain = target.toUpperCase();
        return this;
    },

    ipv(ipv) {
        const ipv_up = ipv.toUpperCase();
        if (ipv_up in e_ipv) {
            this.info.ipv = e_ipv[ipv_up];
            return this;
        }
    },

    protocol(protocol) {
        const p_up = protocol.toUpperCase();
        if (p_up in e_protocol) {
            this.info.protocol = e_protocol[p_up];
            return this;
        }
    },

    port(port) {
        this.info.port = parseInt(port);
        return this;
    },

    source(source) {
        this.info.source = source;
        return this;
    },

    destination(dest) {
        this.info.destination = parseInt(dest);
        return this;
    },

    match(match) {
        this.info.match = match;
        return this;
    },

    jump(jump) {
        this.info.jump = jump;
        return this;
    },

    goto(goto) {
        this.info.goto = goto;
        return this;
    },

    interface_in(int_in) {
        this.info.interface_in = int_in;
        return this;
    },

    interface_out(int_out) {
        this.info.interface_in = int_out;
        return this;
    },

    fragment(fragment) {
        this.info.fragment = fragment;
        return this;
    },

    counters(counters) {
        this.info.counters = counters;
        return this;
    },

    saveString(saveString) {
        this.info.saveString = saveString;
        return this;
    },

    build() {
        return new IpTableRule(this.info);
    }
});

class IpTableRule {
    constructor(info) {
        Object.assign(this, info);
    }

    toString() {
        var response = "";
        // response += this.chain      + "\t";
        // response += this.protocol    + "\t";
        // response += "--"    + "\t"; //opt? todo
        // response += this.source      + "\t";
        // response += this.destination + "\t";
        // response += this.port + "\t";
        // return response;

        for (var property in this) {
            if (property !== "" && property !== "saveString")
                response += this[property] + "\t";
        }
        return response;
    }
}

module.exports = rule;
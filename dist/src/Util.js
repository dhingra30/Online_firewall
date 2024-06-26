const deepEqual = function (x, y) {
    if ((typeof x == "object" && x !== null) && (typeof y == "object" && y !== null)) {
        if (Object.keys(x).length != Object.keys(y).length)
            return false;

        for (var prop in x) {
            if (y.hasOwnProperty(prop)) {
                if (! deepEqual(x[prop], y[prop]))
                    return false;
            } else
                return false;
        }
        return true;
    } else {
        return x === y;
    }
};

const protocol = {
    TCP:    "tcp",
    UDP:    "udp",
    UDPLITE:"udplite",
    ICMP:   "icmp",
    ESP:    "esp",
    AH:     "ah",
    SCTP:   "sctp",
    ALL:    "all",
};

const ipv = {
    IPV4:   "ipv4",
    IPV6:   "ipv6",
};

const dports = {
    ftp:    "20:21",
    ssh:    "22",
    telnet: "23",
    smtp:   "25",
    dns:    "53",
    dhcp:   "67:68",
    tftp:   "69",
    http:   "80",
    https:  "443"
    // todo: long list
};


/*

 filter:
    This is the default table (if no -t option is passed).
    It contains the built-in chain
        INPUT (for packets destined to local sockets),
        FORWARD (for packets being routed through the box), and
        OUTPUT (for locally-generated packets).
 nat:
    This table is consulted when a packet that creates a new connection is encountered.
    It consists of three built-ins:
        PREROUTING (for altering packets as soon as they come in),
        OUTPUT (for altering locally-generated packets before routing), and
        POSTROUTING (for altering packets as they are about to go out).
 mangle:
    This table is used for specialized packet alteration.
    Until kernel 2.4.17 it had two built-in chain:
        PREROUTING (for altering incoming packets before routing) and
        OUTPUT (for altering locally-generated packets before routing).

    Since kernel 2.4.18, three other built-in chain are also supported:
        INPUT (for packets coming into the box itself),
        FORWARD (for altering packets being routed through the box), and
        POSTROUTING (for altering packets as they are about to go out).
 raw:
    This table is used mainly for configuring exemptions from connection tracking in combination with the NOTRACK chain.
    It registers at the netfilter hooks with higher priority and is thus called before ip_conntrack, or any other IP tables.
    It provides the following built-in chain:
        PREROUTING (for packets arriving via any network interface)
        OUTPUT (for packets generated by local processes)
 security:
    This table is used for Mandatory Access Control (MAC) networking rules, such as those enabled by the SECMARK and CONNSECMARK targets.
    Mandatory Access Control is implemented by Linux Security Modules such as SELinux.
    The security table is called after the filter table, allowing any Discretionary Access Control (DAC) rules in the filter table to take effect before MAC rules.
    This table provides the following built-in chain:
        INPUT (for packets coming into the box itself),
        OUTPUT (for altering locally-generated packets before routing), and
        FORWARD (for altering packets being routed through the box).

 */
var tableTypes = {
    FILTER  : {
        name    : "filter",
        chain  : {
            INPUT       : "INPUT",
            FORWARD     : "FORWARD",
            OUTPUT      : "OUTPUT",
        }

    },
    NAT     : {
        name    : "nat",
        chain  : {
            PREROUTING  : "PREROUTING",
            OUTPUT      : "OUTPUT",
            POSTROUTING : "POSTROUTING",
        }
    },
    MANGLE  : {
        name    : "mangle",
        chain  : {
            INPUT       : "INPUT",
            FORWARD     : "FORWARD",
            POSTROUTING : "POSTROUTING",
        }
    },
    RAW  : {
        name    : "raw",
        chain  : {
            PREROUTING  : "PREROUTING",
            OUTPUT      : "OUTPUT",
        }
    },
    SECURITY  : {
        name    : "security",
        chain  : {
            INPUT       : "INPUT",
            OUTPUT      : "OUTPUT",
            FORWARD     : "FORWARD",
        }
    },
};

const randomByte = function() {
    return Math.round(Math.random()*256);
};

function isPrivate(ip) {
    var parts = ip.split('.');
    return parts[0] === '10' ||
        (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
        (parts[0] === '192' && parts[1] === '168');
}

const randomIp = function() {
    var ip = randomByte() +'.' +
        randomByte() +'.' +
        randomByte() +'.' +
        randomByte();
    if (isPrivate(ip)) return randomIp();
    return ip;
};

const keyCodes = {
    RETURN      : 13,
    ARROW_UP    : 38,
    ARROW_DOWN  : 40,
};

module.exports = { deepEqual, protocol, ipv, tableTypes, dports, randomIp, keyCodes };
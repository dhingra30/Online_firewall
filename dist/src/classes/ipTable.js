const util      = require("../util");
const Netmask   = require('netmask').Netmask;

class IpTable {
    constructor(key) {
        this.key = key;
        this.rules = [];
    }

    _loadHistory() {
        const history = JSON.parse(window.localStorage.getItem(this.key));
        if (history) {
            const table = history[0];
            table.forEach(function(rule) {
                var newRule = rule();
                newRule.info = rule;
                this.addRule(this.tables[i], newRule.build());
            });
        }
    }

    addRule(rule) {
        if (this._tableContainsRule(rule))
            return false;

        this.rules.push(rule);
        return true;
    }

    insertRule(chain, position, rule) {
        if (this._tableContainsRule(rule))
            return false;

        var chain_rules = this.filterByChain(chain);
        if (position >= chain_rules.length)
            return false;
        chain_rules.splice(position, 0, rule);
        var other_rules = this.otherThanChain(chain);
        this.rules = other_rules.concat(chain_rules);
        return true;
    }

    deleteRule(chain, position) {
        var chain_rules = this.filterByChain(chain);
        if (position >= chain_rules.length)
            return false;
        chain_rules.splice(position, 1);
        var other_rules = this.otherThanChain(chain);
        this.rules = other_rules.concat(chain_rules);
        return true;
    }

    listRules() {
        var response = [];
        for (let c of this.getUniqueChains()) {
            for (let r of this.filterByChain(c)) {
                response.push(r.toString());
            }
        }

        return response;
    }

    resetRules() {
        this.rules = [];
        window.localStorage.setItem(this.key, "");
    }

    resetChain(chain) {
        this.rules = this.rules.filter(function(rule) { return rule.chain !== chain; });
    }

    getUniqueChains() {
        var chains = [];
        for (var rule in this.rules) {
            chains.push(this.rules[rule].chain);
        }

        return chains.filter(function(value, index, self) { return self.indexOf(value) === index; });
    }

    isPortOpened(port, sourceAddr = "anywhere", chain = util.tableTypes.FILTER.chain.INPUT) {
        chain = chain.trim();
        const rules = this.filterByChain(chain);

        // console.log(this.isAddressWithinRange(rules[0].source, sourceAddr));

        // find first rule regarding our port number
        for (let r of rules) {
            // console.log(r);
            if (r.source === "anywhere" || this.isAddressWithinRange(r.source, sourceAddr)) {
                if (r.port === parseInt(port) || r.port === "") {
                    // console.log(r);
                    if (r.jump === "ACCEPT")
                        return true;
                    else if (r.jump === "DROP")
                        return false;
                    else
                        return this.isPortOpened(port, sourceAddr, r.jump);
                }
            }
        }
        return true; // default!
    }

    isAddressWithinRange(ruleAddr, sourceAddr) {
        if (ruleAddr === sourceAddr)
            return true;
        return (new Netmask(ruleAddr)).contains(sourceAddr);

    }

    filterByChain(chain) {
        return this.rules.filter(function(rule) { return rule.chain === chain; });
    }

    otherThanChain(chain) {
        return this.rules.filter(function(rule) { return rule.chain !== chain; });
    }


    _tableContainsRule(rule) {
        for (let r of this.rules) {
            if (util.deepEqual(r, rule)) {
                return true;
            }
        }
        return false;
    }
}

module.exports = IpTable;
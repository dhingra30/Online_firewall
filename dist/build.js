(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
    /* FileSaver.js
     * A saveAs() FileSaver implementation.
     * 1.3.2
     * 2016-06-16 18:25:19
     *
     * By Eli Grey, http://eligrey.com
     * License: MIT
     *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
     */
    
    /*global self */
    /*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */
    
    /*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
    
    var saveAs = saveAs || (function(view) {
        "use strict";
        // IE <10 is explicitly unsupported
        if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
            return;
        }
        var
              doc = view.document
              // only get URL when necessary in case Blob.js hasn't overridden it yet
            , get_URL = function() {
                return view.URL || view.webkitURL || view;
            }
            , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
            , can_use_save_link = "download" in save_link
            , click = function(node) {
                var event = new MouseEvent("click");
                node.dispatchEvent(event);
            }
            , is_safari = /constructor/i.test(view.HTMLElement) || view.safari
            , is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
            , throw_outside = function(ex) {
                (view.setImmediate || view.setTimeout)(function() {
                    throw ex;
                }, 0);
            }
            , force_saveable_type = "application/octet-stream"
            // the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
            , arbitrary_revoke_timeout = 1000 * 40 // in ms
            , revoke = function(file) {
                var revoker = function() {
                    if (typeof file === "string") { // file is an object URL
                        get_URL().revokeObjectURL(file);
                    } else { // file is a File
                        file.remove();
                    }
                };
                setTimeout(revoker, arbitrary_revoke_timeout);
            }
            , dispatch = function(filesaver, event_types, event) {
                event_types = [].concat(event_types);
                var i = event_types.length;
                while (i--) {
                    var listener = filesaver["on" + event_types[i]];
                    if (typeof listener === "function") {
                        try {
                            listener.call(filesaver, event || filesaver);
                        } catch (ex) {
                            throw_outside(ex);
                        }
                    }
                }
            }
            , auto_bom = function(blob) {
                // prepend BOM for UTF-8 XML and text/* types (including HTML)
                // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
                if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                    return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
                }
                return blob;
            }
            , FileSaver = function(blob, name, no_auto_bom) {
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                // First try a.download, then web filesystem, then object URLs
                var
                      filesaver = this
                    , type = blob.type
                    , force = type === force_saveable_type
                    , object_url
                    , dispatch_all = function() {
                        dispatch(filesaver, "writestart progress write writeend".split(" "));
                    }
                    // on any filesys errors revert to saving with object URLs
                    , fs_error = function() {
                        if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
                            // Safari doesn't allow downloading of blob urls
                            var reader = new FileReader();
                            reader.onloadend = function() {
                                var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
                                var popup = view.open(url, '_blank');
                                if(!popup) view.location.href = url;
                                url=undefined; // release reference before dispatching
                                filesaver.readyState = filesaver.DONE;
                                dispatch_all();
                            };
                            reader.readAsDataURL(blob);
                            filesaver.readyState = filesaver.INIT;
                            return;
                        }
                        // don't create more object URLs than needed
                        if (!object_url) {
                            object_url = get_URL().createObjectURL(blob);
                        }
                        if (force) {
                            view.location.href = object_url;
                        } else {
                            var opened = view.open(object_url, "_blank");
                            if (!opened) {
                                // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
                                view.location.href = object_url;
                            }
                        }
                        filesaver.readyState = filesaver.DONE;
                        dispatch_all();
                        revoke(object_url);
                    }
                ;
                filesaver.readyState = filesaver.INIT;
    
                if (can_use_save_link) {
                    object_url = get_URL().createObjectURL(blob);
                    setTimeout(function() {
                        save_link.href = object_url;
                        save_link.download = name;
                        click(save_link);
                        dispatch_all();
                        revoke(object_url);
                        filesaver.readyState = filesaver.DONE;
                    });
                    return;
                }
    
                fs_error();
            }
            , FS_proto = FileSaver.prototype
            , saveAs = function(blob, name, no_auto_bom) {
                return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
            }
        ;
        // IE 10+ (native saveAs)
        if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
            return function(blob, name, no_auto_bom) {
                name = name || blob.name || "download";
    
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                return navigator.msSaveOrOpenBlob(blob, name);
            };
        }
    
        FS_proto.abort = function(){};
        FS_proto.readyState = FS_proto.INIT = 0;
        FS_proto.WRITING = 1;
        FS_proto.DONE = 2;
    
        FS_proto.error =
        FS_proto.onwritestart =
        FS_proto.onprogress =
        FS_proto.onwrite =
        FS_proto.onabort =
        FS_proto.onerror =
        FS_proto.onwriteend =
            null;
    
        return saveAs;
    }(
           typeof self !== "undefined" && self
        || typeof window !== "undefined" && window
        || this.content
    ));
    // `self` is undefined in Firefox for Android content script context
    // while `this` is nsIContentFrameMessageManager
    // with an attribute `content` that corresponds to the window
    
    if (typeof module !== "undefined" && module.exports) {
      module.exports.saveAs = saveAs;
    } else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
      define("FileSaver.js", function() {
        return saveAs;
      });
    }
    
    },{}],2:[function(require,module,exports){
    // Generated by CoffeeScript 1.10.0
    (function() {
      var Netmask, ip2long, long2ip;
    
      long2ip = function(long) {
        var a, b, c, d;
        a = (long & (0xff << 24)) >>> 24;
        b = (long & (0xff << 16)) >>> 16;
        c = (long & (0xff << 8)) >>> 8;
        d = long & 0xff;
        return [a, b, c, d].join('.');
      };
    
      ip2long = function(ip) {
        var b, byte, i, j, len;
        b = (ip + '').split('.');
        if (b.length === 0 || b.length > 4) {
          throw new Error('Invalid IP');
        }
        for (i = j = 0, len = b.length; j < len; i = ++j) {
          byte = b[i];
          if (isNaN(parseInt(byte, 10))) {
            throw new Error("Invalid byte: " + byte);
          }
          if (byte < 0 || byte > 255) {
            throw new Error("Invalid byte: " + byte);
          }
        }
        return ((b[0] || 0) << 24 | (b[1] || 0) << 16 | (b[2] || 0) << 8 | (b[3] || 0)) >>> 0;
      };
    
      Netmask = (function() {
        function Netmask(net, mask) {
          var error, error1, error2, i, j, ref;
          if (typeof net !== 'string') {
            throw new Error("Missing `net' parameter");
          }
          if (!mask) {
            ref = net.split('/', 2), net = ref[0], mask = ref[1];
          }
          if (!mask) {
            switch (net.split('.').length) {
              case 1:
                mask = 8;
                break;
              case 2:
                mask = 16;
                break;
              case 3:
                mask = 24;
                break;
              case 4:
                mask = 32;
                break;
              default:
                throw new Error("Invalid net address: " + net);
            }
          }
          if (typeof mask === 'string' && mask.indexOf('.') > -1) {
            try {
              this.maskLong = ip2long(mask);
            } catch (error1) {
              error = error1;
              throw new Error("Invalid mask: " + mask);
            }
            for (i = j = 32; j >= 0; i = --j) {
              if (this.maskLong === (0xffffffff << (32 - i)) >>> 0) {
                this.bitmask = i;
                break;
              }
            }
          } else if (mask) {
            this.bitmask = parseInt(mask, 10);
            this.maskLong = 0;
            if (this.bitmask > 0) {
              this.maskLong = (0xffffffff << (32 - this.bitmask)) >>> 0;
            }
          } else {
            throw new Error("Invalid mask: empty");
          }
          try {
            this.netLong = (ip2long(net) & this.maskLong) >>> 0;
          } catch (error2) {
            error = error2;
            throw new Error("Invalid net address: " + net);
          }
          if (!(this.bitmask <= 32)) {
            throw new Error("Invalid mask for ip4: " + mask);
          }
          this.size = Math.pow(2, 32 - this.bitmask);
          this.base = long2ip(this.netLong);
          this.mask = long2ip(this.maskLong);
          this.hostmask = long2ip(~this.maskLong);
          this.first = this.bitmask <= 30 ? long2ip(this.netLong + 1) : this.base;
          this.last = this.bitmask <= 30 ? long2ip(this.netLong + this.size - 2) : long2ip(this.netLong + this.size - 1);
          this.broadcast = this.bitmask <= 30 ? long2ip(this.netLong + this.size - 1) : void 0;
        }
    
        Netmask.prototype.contains = function(ip) {
          if (typeof ip === 'string' && (ip.indexOf('/') > 0 || ip.split('.').length !== 4)) {
            ip = new Netmask(ip);
          }
          if (ip instanceof Netmask) {
            return this.contains(ip.base) && this.contains(ip.broadcast || ip.last);
          } else {
            return (ip2long(ip) & this.maskLong) >>> 0 === (this.netLong & this.maskLong) >>> 0;
          }
        };
    
        Netmask.prototype.next = function(count) {
          if (count == null) {
            count = 1;
          }
          return new Netmask(long2ip(this.netLong + (this.size * count)), this.mask);
        };
    
        Netmask.prototype.forEach = function(fn) {
          var index, j, k, len, long, range, ref, ref1, results, results1;
          range = (function() {
            results = [];
            for (var j = ref = ip2long(this.first), ref1 = ip2long(this.last); ref <= ref1 ? j <= ref1 : j >= ref1; ref <= ref1 ? j++ : j--){ results.push(j); }
            return results;
          }).apply(this);
          results1 = [];
          for (index = k = 0, len = range.length; k < len; index = ++k) {
            long = range[index];
            results1.push(fn(long2ip(long), long, index));
          }
          return results1;
        };
    
        Netmask.prototype.toString = function() {
          return this.base + "/" + this.bitmask;
        };
    
        return Netmask;
    
      })();
    
      exports.ip2long = ip2long;
    
      exports.long2ip = long2ip;
    
      exports.Netmask = Netmask;
    
    }).call(this);
    
    },{}],3:[function(require,module,exports){
    "use strict";
    
    var CommandsProcessor = require("./classes/CommandsProcessor");
    var Terminal = require("./classes/Terminal");
    
    var cmdProcessor = new CommandsProcessor();
    
    var term_o = new Terminal($('#o'), "outsider", cmdProcessor);
    var term_i = new Terminal($('#i'), "insider", cmdProcessor);
    
    term_o.otherTerminal = term_i;
    term_i.otherTerminal = term_o;
    
    window.onbeforeunload = function () {
        term_o.saveIp();
        term_i.saveIp();
        term_o.msgManager.save();
        term_i.msgManager.save();
        term_o.ipTable.save();
        term_i.ipTable.save();
    };
    
    },{"./classes/CommandsProcessor":4,"./classes/Terminal":9}],4:[function(require,module,exports){
    "use strict";
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var Message = require("./Message");
    var util = require("../util");
    var rule = require("../../src/classes/IpTableRule");
    
    var CommandsProcessor = function () {
        function CommandsProcessor() {
            _classCallCheck(this, CommandsProcessor);
        }
    
        _createClass(CommandsProcessor, [{
            key: "findToken",
            value: function findToken(msg, flag, regexps) {
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
                var matches = new RegExp(regexpExec, 'g').exec(msg);
    
                if (!matches) return { found: false };
    
                // re-assign to original property, ie. chain: INPUT, position: 4
                for (i = 1; i < matches.length; i++) {
                    regexps[Object.keys(regexps).find(function (key) {
                        return regexps[key] === i - 1;
                    })] = matches[i];
                } // marges objects
                return Object.assign({ found: true }, regexps);
            }
        }, {
            key: "error",
            value: function error() {
                if (this.terminal === undefined) return { action: "error" };
                this.terminal.add(new Message("bash", "Invalid rule."));
                return { action: "error" };
            }
        }, {
            key: "processIpRule",
            value: function processIpRule(msg) {
                var newRule = rule();
                newRule.saveString(msg);
    
                var word = "\\w+";
    
                var fEmpty = this.findToken(msg, "-F", {});
                var f = this.findToken(msg, "-F", { chain: word });
                var a = this.findToken(msg, "-A", { chain: word });
                var i = this.findToken(msg, "-I", { chain: word, position: word });
                var d = this.findToken(msg, "-D", { chain: word, position: word });
                var s = this.findToken(msg, "-s", { sourceAddr: "[\\.|\\/|\\w]+" });
                var p = this.findToken(msg, "-p", { protocol: word });
                var j = this.findToken(msg, "-j", { jump: word });
                var dport = this.findToken(msg, "--dport", { port: word });
    
                // build up rule
                if (a.found) newRule.chain(a.chain);
                if (i.found) newRule.chain(i.chain);
                if (s.found) newRule.source(s.sourceAddr);
                if (p.found) {
                    if (p.protocol === "tcp" || p.protocol === "udp" || p.protocol === "all") newRule.protocol(p.protocol);else this.error();
                }
                if (j.found) newRule.jump(j.jump);
                if (dport.found) {
                    if (dport.port in util.dports) newRule.port(util.dports[dport.port]);else if (dport.port > 0 && dport.port < 65535) newRule.port(dport.port);else this.error();
                }
                if (this.terminal === undefined) return newRule.build();
    
                if (f.found) this.terminal.ipTable.resetChain(f.chain);else if (fEmpty.found) this.terminal.ipTable.resetRules();else if (a.found) this.terminal.ipTable.addRule(newRule.build());else if (i.found) this.terminal.ipTable.insertRule(i.chain, i.position, newRule.build());else if (d.found) this.terminal.ipTable.deleteRule(d.chain, d.position);else this.error();
            }
        }, {
            key: "processNmap",
            value: function processNmap(tokens) {
                // our version requires "nmap -p <port> <address>"
                if (tokens.length !== 4) return this.error();
    
                var sourceAddr = this.terminal.ip;
                var port = tokens[2];
                var targetTerminal;
                if (this.terminal.user_name === tokens[3] || this.terminal.ip === tokens[3]) targetTerminal = this.terminal;else if (this.terminal.otherTerminal.user_name === tokens[3] || this.terminal.otherTerminal.ip === tokens[3]) targetTerminal = this.terminal.otherTerminal;else return this.terminal.add(new Message("bash", "Target ip address not known."));
    
                if (targetTerminal.ipTable.isPortOpened(port, sourceAddr)) return this.terminal.add(new Message("console", "Port " + port + " at IP: " + targetTerminal.ip + " is opened."));else return this.terminal.add(new Message("console", "Port " + port + " at IP: " + targetTerminal.ip + " is closed."));
            }
        }, {
            key: "process",
            value: function process(terminal, msg) {
                this.terminal = terminal;
                var tokens = CommandsProcessor.tokenise(msg);
    
                if (tokens[0] === "iptables") {
                    if (tokens[1] === "-L") {
                        // display current rules
                        var _iteratorNormalCompletion = true;
                        var _didIteratorError = false;
                        var _iteratorError = undefined;
    
                        try {
                            for (var _iterator = terminal.ipTable.listRules()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                var r = _step.value;
    
                                terminal.add(new Message("console", r));
                            }
                        } catch (err) {
                            _didIteratorError = true;
                            _iteratorError = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion && _iterator.return) {
                                    _iterator.return();
                                }
                            } finally {
                                if (_didIteratorError) {
                                    throw _iteratorError;
                                }
                            }
                        }
                    } else {
                        this.processIpRule(msg);
                    }
                    return;
                } else if (tokens[0] === "nmap") {
                    this.processNmap(tokens);
                    return;
                } else if (tokens[0] === "set" && tokens[1] === "ip") {
                    if (CommandsProcessor.isValidIpv4(tokens[2])) terminal.ip = tokens[2];else terminal.add(new Message("console", "Invalid IPv4 address: " + tokens[2]));
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
        }], [{
            key: "tokenise",
            value: function tokenise(msg) {
                return msg.split(" ");
            }
        }, {
            key: "isValidIpv4",
            value: function isValidIpv4(token) {
                var chunks = token.split('.');
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;
    
                try {
                    for (var _iterator2 = chunks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var c = _step2.value;
    
                        if (!c.match(/^[0-9\/]+$/i)) return false;
                        if (c < 0 || c > 255) return false;
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
    
                return true;
            }
        }]);
    
        return CommandsProcessor;
    }();
    
    module.exports = CommandsProcessor;
    
    },{"../../src/classes/IpTableRule":6,"../util":10,"./Message":7}],5:[function(require,module,exports){
    "use strict";
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var util = require("../util");
    var Netmask = require('netmask').Netmask;
    
    var IpTable = function () {
        function IpTable(key) {
            _classCallCheck(this, IpTable);
    
            this.key = key;
            this.rules = [];
        }
    
        _createClass(IpTable, [{
            key: "_loadHistory",
            value: function _loadHistory() {
                var history = JSON.parse(window.localStorage.getItem(this.key));
                if (history) {
                    var table = history[0];
                    table.forEach(function (rule) {
                        var newRule = rule();
                        newRule.info = rule;
                        this.addRule(this.tables[i], newRule.build());
                    });
                }
            }
        }, {
            key: "addRule",
            value: function addRule(rule) {
                if (this._tableContainsRule(rule)) return false;
    
                this.rules.push(rule);
                return true;
            }
        }, {
            key: "insertRule",
            value: function insertRule(chain, position, rule) {
                if (this._tableContainsRule(rule)) return false;
    
                var chain_rules = this.filterByChain(chain);
                if (position >= chain_rules.length) return false;
                chain_rules.splice(position, 0, rule);
                var other_rules = this.otherThanChain(chain);
                this.rules = other_rules.concat(chain_rules);
                return true;
            }
        }, {
            key: "deleteRule",
            value: function deleteRule(chain, position) {
                var chain_rules = this.filterByChain(chain);
                if (position >= chain_rules.length) return false;
                chain_rules.splice(position, 1);
                var other_rules = this.otherThanChain(chain);
                this.rules = other_rules.concat(chain_rules);
                return true;
            }
        }, {
            key: "listRules",
            value: function listRules() {
                var response = [];
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;
    
                try {
                    for (var _iterator = this.getUniqueChains()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var c = _step.value;
                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;
    
                        try {
                            for (var _iterator2 = this.filterByChain(c)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var r = _step2.value;
    
                                response.push(r.toString());
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                    _iterator2.return();
                                }
                            } finally {
                                if (_didIteratorError2) {
                                    throw _iteratorError2;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
    
                return response;
            }
        }, {
            key: "resetRules",
            value: function resetRules() {
                this.rules = [];
                window.localStorage.setItem(this.key, "");
            }
        }, {
            key: "resetChain",
            value: function resetChain(chain) {
                this.rules = this.rules.filter(function (rule) {
                    return rule.chain !== chain;
                });
            }
        }, {
            key: "getUniqueChains",
            value: function getUniqueChains() {
                var chains = [];
                for (var rule in this.rules) {
                    chains.push(this.rules[rule].chain);
                }
    
                return chains.filter(function (value, index, self) {
                    return self.indexOf(value) === index;
                });
            }
        }, {
            key: "isPortOpened",
            value: function isPortOpened(port) {
                var sourceAddr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "anywhere";
                var chain = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : util.tableTypes.FILTER.chain.INPUT;
    
                chain = chain.trim();
                var rules = this.filterByChain(chain);
    
                // console.log(this.isAddressWithinRange(rules[0].source, sourceAddr));
    
                // find first rule regarding our port number
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;
    
                try {
                    for (var _iterator3 = rules[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var r = _step3.value;
    
                        // console.log(r);
                        if (r.source === "anywhere" || this.isAddressWithinRange(r.source, sourceAddr)) {
                            if (r.port === parseInt(port) || r.port === "") {
                                // console.log(r);
                                if (r.jump === "ACCEPT") return true;else if (r.jump === "DROP") return false;else return this.isPortOpened(port, sourceAddr, r.jump);
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
    
                return true; // default!
            }
        }, {
            key: "isAddressWithinRange",
            value: function isAddressWithinRange(ruleAddr, sourceAddr) {
                if (ruleAddr === sourceAddr) return true;
                return new Netmask(ruleAddr).contains(sourceAddr);
            }
        }, {
            key: "filterByChain",
            value: function filterByChain(chain) {
                return this.rules.filter(function (rule) {
                    return rule.chain === chain;
                });
            }
        }, {
            key: "otherThanChain",
            value: function otherThanChain(chain) {
                return this.rules.filter(function (rule) {
                    return rule.chain !== chain;
                });
            }
        }, {
            key: "_tableContainsRule",
            value: function _tableContainsRule(rule) {
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;
    
                try {
                    for (var _iterator4 = this.rules[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                        var r = _step4.value;
    
                        if (util.deepEqual(r, rule)) {
                            return true;
                        }
                    }
                } catch (err) {
                    _didIteratorError4 = true;
                    _iteratorError4 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                            _iterator4.return();
                        }
                    } finally {
                        if (_didIteratorError4) {
                            throw _iteratorError4;
                        }
                    }
                }
    
                return false;
            }
        }]);
    
        return IpTable;
    }();
    
    module.exports = IpTable;
    
    },{"../util":10,"netmask":2}],6:[function(require,module,exports){
    "use strict";
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var util = require("../util");
    var e_protocol = util.protocol;
    var e_ipv = util.ipv;
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
    
    var rule = function rule() {
        return {
            info: {
                chain: "INPUT",
                ipv: "",
                protocol: e_protocol.ALL,
                port: "",
                source: "anywhere",
                destination: "anywhere",
                match: "",
                jump: "",
                goto: "",
                interface_in: "",
                interface_out: "",
                fragment: "",
                counters: "",
                saveString: ""
            },
    
            chain: function chain(target) {
                this.info.chain = target.toUpperCase();
                return this;
            },
            ipv: function ipv(_ipv) {
                var ipv_up = _ipv.toUpperCase();
                if (ipv_up in e_ipv) {
                    this.info.ipv = e_ipv[ipv_up];
                    return this;
                }
            },
            protocol: function protocol(_protocol) {
                var p_up = _protocol.toUpperCase();
                if (p_up in e_protocol) {
                    this.info.protocol = e_protocol[p_up];
                    return this;
                }
            },
            port: function port(_port) {
                this.info.port = parseInt(_port);
                return this;
            },
            source: function source(_source) {
                this.info.source = _source;
                return this;
            },
            destination: function destination(dest) {
                this.info.destination = parseInt(dest);
                return this;
            },
            match: function match(_match) {
                this.info.match = _match;
                return this;
            },
            jump: function jump(_jump) {
                this.info.jump = _jump;
                return this;
            },
            goto: function goto(_goto) {
                this.info.goto = _goto;
                return this;
            },
            interface_in: function interface_in(int_in) {
                this.info.interface_in = int_in;
                return this;
            },
            interface_out: function interface_out(int_out) {
                this.info.interface_in = int_out;
                return this;
            },
            fragment: function fragment(_fragment) {
                this.info.fragment = _fragment;
                return this;
            },
            counters: function counters(_counters) {
                this.info.counters = _counters;
                return this;
            },
            saveString: function saveString(_saveString) {
                this.info.saveString = _saveString;
                return this;
            },
            build: function build() {
                return new IpTableRule(this.info);
            }
        };
    };
    
    var IpTableRule = function () {
        function IpTableRule(info) {
            _classCallCheck(this, IpTableRule);
    
            Object.assign(this, info);
        }
    
        _createClass(IpTableRule, [{
            key: "toString",
            value: function toString() {
                var response = "";
                // response += this.chain      + "\t";
                // response += this.protocol    + "\t";
                // response += "--"    + "\t"; //opt? todo
                // response += this.source      + "\t";
                // response += this.destination + "\t";
                // response += this.port + "\t";
                // return response;
    
                for (var property in this) {
                    if (property !== "" && property !== "saveString") response += this[property] + "\t";
                }
                return response;
            }
        }]);
    
        return IpTableRule;
    }();
    
    module.exports = rule;
    
    },{"../util":10}],7:[function(require,module,exports){
    "use strict";
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var Message = function () {
        function Message(author, message, timestamp) {
            _classCallCheck(this, Message);
    
            if (typeof timestamp === 'undefined') {
                this.timestamp = Date.now();
            } else {
                this.timestamp = timestamp;
            }
            this.author = author;
            this.message = message;
        }
    
        _createClass(Message, [{
            key: "toString",
            value: function toString() {
                if (this.author === "bash") {
                    return this.author + ": " + this.message;
                }
                if (this.author === "console") {
                    return this.message;
                }
    
                var date = new Date(this.timestamp); //*1000 so it's in ms not s
    
                var hours = date.getHours();
                var minutes = date.getMinutes();
                var seconds = date.getSeconds();
    
                if (hours < 10) hours = "0" + hours;
                if (minutes < 10) minutes = "0" + minutes;
                if (seconds < 10) seconds = "0" + seconds;
    
                var time = "[" + [hours, minutes, seconds].join(":") + "]";
    
                return time + " " + this.author + ": " + this.message;
            }
        }]);
    
        return Message;
    }();
    
    module.exports = Message;
    
    },{}],8:[function(require,module,exports){
    "use strict";
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var Message = require("./Message");
    var util = require("../util");
    
    var MessagesManager = function () {
        function MessagesManager(key) {
            _classCallCheck(this, MessagesManager);
    
            this.key = key;
            this.msgs = [];
    
            this._upDownCurPlace = 0;
    
            this._loadHistory();
        }
    
        _createClass(MessagesManager, [{
            key: "_loadHistory",
            value: function _loadHistory() {
                var history = JSON.parse(window.localStorage.getItem(this.key));
    
                if (history) {
                    for (var i in history) {
                        var m = history[i];
                        this.msgs.push(new Message(m.author, m.message, m.timestamp));
                    }
                }
            }
        }, {
            key: "_getUserMsgs",
            value: function _getUserMsgs() {
                var msgs = [];
                for (var i = 0; i < this.msgs.length; i++) {
                    var m = this.msgs[i];
                    if (m.author !== "bash" && m.author !== "console") {
                        msgs.push(m);
                    }
                }
                return msgs;
            }
        }, {
            key: "upDownUserMsg",
            value: function upDownUserMsg(keyCode) {
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
        }, {
            key: "add",
            value: function add(msg) {
                this.msgs.push(msg);
                this._upDownCurPlace = 0;
            }
        }, {
            key: "save",
            value: function save() {
                window.localStorage.setItem(this.key, JSON.stringify(this.msgs));
            }
        }, {
            key: "delete",
            value: function _delete() {
                this.msgs = [];
                window.localStorage.setItem(this.key, "");
            }
        }]);
    
        return MessagesManager;
    }();
    
    module.exports = MessagesManager;
    
    },{"../util":10,"./Message":7}],9:[function(require,module,exports){
    "use strict";
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var IpTable = require("./IpTable");
    var FileSaver = require('file-saver');
    var MessagesManager = require("./MessagesManager");
    var Message = require("./Message");
    var util = require("../util");
    
    var Terminal = function () {
        function Terminal(elem, userName, cmdProcessor) {
            _classCallCheck(this, Terminal);
    
            this.terminal = elem;
            this._id = elem.attr('id');
            this.elem_messages = elem.find('.messages');
            this.elem_input = elem.find('input');
            this.msgManager = new MessagesManager(this._id);
            this.user_name = userName;
            this.cmdProcessor = cmdProcessor;
    
            this._init();
        }
    
        _createClass(Terminal, [{
            key: "_init",
            value: function _init() {
                var _this = this;
    
                this._loadHistory();
                if (localStorage.getItem(this._id + "Ip") === null) this.ip = util.randomIp();else this.ip = localStorage.getItem(this._id + "Ip");
    
                this.elem_input.keyup(function (event) {
                    return _this._listener(event);
                });
                $('#' + this._id + 'File').change(function (event) {
                    return _this._rulesUpload(event);
                });
                $('#' + this._id + 'Download').click(function (event) {
                    return _this._rulesDownload(event);
                });
    
                this.changeUser(this.user_name);
    
                // iptables
                this.ipTable = new IpTable(this._id + "Rule");
            }
        }, {
            key: "_rulesUpload",
            value: function _rulesUpload(event) {
                var f = event.target.files[0];
                var reader = new FileReader();
                reader.terminal = this;
                reader.onload = function (reader) {
                    return function () {
                        reader.terminal.ipTable.resetRules();
                        var contents = reader.result.split('\n');
                        contents.forEach(function (line) {
                            if (line.trim().substr(0, 2) !== "##") {
                                reader.terminal.cmdProcessor.process(reader.terminal, line);
                            }
                        });
                        reader.terminal.cmdProcessor.process(reader.terminal, "iptables -L");
                    };
                }(reader);
                reader.readAsText(f);
            }
        }, {
            key: "_rulesDownload",
            value: function _rulesDownload(event) {
                var rules = this.ipTable.rules;
                var toSave = [];
                rules.forEach(function (rule) {
                    toSave.push(rule.saveString);
                });
                var blob = new Blob([toSave.join('\n')], { type: "text/plain;charset=utf-8" });
                FileSaver.saveAs(blob, (this._id === "i" ? "insider" : "ousider") + ".rules");
            }
        }, {
            key: "changeOtherTerminal",
            value: function changeOtherTerminal(terminal) {
                this.otherTerminal = terminal;
            }
        }, {
            key: "changeUser",
            value: function changeUser(name) {
                this.user_name = name;
                this.terminal.find('.name').text(name + ":");
            }
        }, {
            key: "clearMessages",
            value: function clearMessages() {
                this.elem_messages.html("");
            }
        }, {
            key: "_loadHistory",
            value: function _loadHistory() {
                var _this2 = this;
    
                if (!this.msgManager.msgs) return;
    
                this.msgManager.msgs.forEach(function (msg) {
                    _this2._append(msg);
                });
            }
        }, {
            key: "add",
            value: function add(message) {
                this.msgManager.add(message);
                this._append(message);
            }
        }, {
            key: "_append",
            value: function _append(message) {
                this.elem_messages.append('<p>' + message.toString() + '</p>');
            }
        }, {
            key: "deleteMsgs",
            value: function deleteMsgs() {
                this.msgManager.delete();
                this.clearMessages();
            }
        }, {
            key: "_listener",
            value: function _listener(event) {
                var msg;
                switch (event.keyCode) {
                    case util.keyCodes.RETURN:
                        msg = this.elem_input.val();
    
                        msg = new Message(this.user_name, msg);
                        this.add(msg);
                        this.cmdProcessor.process(this, msg.message);
                        this.elem_input.val("");
                        this.msgManager.save();
                        break;
    
                    case util.keyCodes.ARROW_UP:
                    case util.keyCodes.ARROW_DOWN:
                        msg = this.msgManager.upDownUserMsg(event.keyCode);
                        this.elem_input.val(typeof msg !== "undefined" ? msg.message : "");
                        break;
                }
            }
        }, {
            key: "saveIp",
            value: function saveIp() {
                window.localStorage.setItem(this._id + "Ip", this.ip);
            }
        }]);
    
        return Terminal;
    }();
    
    module.exports = Terminal;
    
    },{"../util":10,"./IpTable":5,"./Message":7,"./MessagesManager":8,"file-saver":1}],10:[function(require,module,exports){
    "use strict";
    
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
    
    var deepEqual = function deepEqual(x, y) {
        if ((typeof x === "undefined" ? "undefined" : _typeof(x)) == "object" && x !== null && (typeof y === "undefined" ? "undefined" : _typeof(y)) == "object" && y !== null) {
            if (Object.keys(x).length != Object.keys(y).length) return false;
    
            for (var prop in x) {
                if (y.hasOwnProperty(prop)) {
                    if (!deepEqual(x[prop], y[prop])) return false;
                } else return false;
            }
            return true;
        } else {
            return x === y;
        }
    };
    
    var protocol = {
        TCP: "tcp",
        UDP: "udp",
        UDPLITE: "udplite",
        ICMP: "icmp",
        ESP: "esp",
        AH: "ah",
        SCTP: "sctp",
        ALL: "all"
    };
    
    var ipv = {
        IPV4: "ipv4",
        IPV6: "ipv6"
    };
    
    var dports = {
        ftp: "20:21",
        ssh: "22",
        telnet: "23",
        smtp: "25",
        dns: "53",
        dhcp: "67:68",
        tftp: "69",
        http: "80",
        https: "443"
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
        FILTER: {
            name: "filter",
            chain: {
                INPUT: "INPUT",
                FORWARD: "FORWARD",
                OUTPUT: "OUTPUT"
            }
    
        },
        NAT: {
            name: "nat",
            chain: {
                PREROUTING: "PREROUTING",
                OUTPUT: "OUTPUT",
                POSTROUTING: "POSTROUTING"
            }
        },
        MANGLE: {
            name: "mangle",
            chain: {
                INPUT: "INPUT",
                FORWARD: "FORWARD",
                POSTROUTING: "POSTROUTING"
            }
        },
        RAW: {
            name: "raw",
            chain: {
                PREROUTING: "PREROUTING",
                OUTPUT: "OUTPUT"
            }
        },
        SECURITY: {
            name: "security",
            chain: {
                INPUT: "INPUT",
                OUTPUT: "OUTPUT",
                FORWARD: "FORWARD"
            }
        }
    };
    
    var randomByte = function randomByte() {
        return Math.round(Math.random() * 256);
    };
    
    function isPrivate(ip) {
        var parts = ip.split('.');
        return parts[0] === '10' || parts[0] === '172' && parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31 || parts[0] === '192' && parts[1] === '168';
    }
    
    var randomIp = function randomIp() {
        var ip = randomByte() + '.' + randomByte() + '.' + randomByte() + '.' + randomByte();
        if (isPrivate(ip)) return randomIp();
        return ip;
    };
    
    var keyCodes = {
        RETURN: 13,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };
    
    module.exports = { deepEqual: deepEqual, protocol: protocol, ipv: ipv, tableTypes: tableTypes, dports: dports, randomIp: randomIp, keyCodes: keyCodes };
    
    },{}]},{},[3])
    
    //# sourceMappingURL=build.js.map
    
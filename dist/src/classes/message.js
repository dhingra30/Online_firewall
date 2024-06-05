class Message {
    constructor(author, message, timestamp) {
        if (typeof timestamp === 'undefined') {
            this.timestamp = Date.now();
        } else {
            this.timestamp = timestamp;
        }
        this.author = author;
        this.message = message;
    }

    toString() {
        if (this.author === "bash")     { return this.author + ": " + this.message; }
        if (this.author === "console")  { return this.message; }

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
}

module.exports = Message;
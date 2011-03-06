var Stream = require('stream').Stream
    , util = require('util')
    //, Queue = require('./queue');

var slice = Array.prototype.slice;

/**
 * Stream that will buffer writes, designed for piping
 */
function BufferedStream (limit) {
    this.readable = true;
    this.writable = true;

    this.buffering = true;
    this.limit = limit || 4096;
    this.size = 0;
    this.dataQueue = [];
}

util.inherits(BufferedStream, Stream);

BufferedStream.prototype.bufferSize = function() {
    return this.dataQueue.length;
}

BufferedStream.prototype.pipe = function (dest) {
    Stream.prototype.pipe.apply(this, slice.call(arguments));

    this.flush();
}

BufferedStream.prototype.send = function() {
    if(this.buffering || !this.dataQueue.length) return;

    var chunk = this.dataQueue.shift();
    this.size -= chunk.length;
    this.emit('data', chunk);
}

BufferedStream.prototype.flush = function() {
    this.buffering = false;
    this.send();

    if(this.dataQueue.length) {
        var source = this;
        process.nextTick(function() {
            source.send();
        });
    }
}

BufferedStream.prototype.write = function (chunk) {
    this.dataQueue.push(chunk);

    if (this.limit < this.size) {
        this.emit('bufferOverrun', this.size);
    }

    if(!this.buffering)
        this.flush();
}

BufferedStream.prototype.pause = function() {
    this.buffering = true;
    this.emit('pause');
}

BufferedStream.prototype.resume = function() {
    this.emit('resume');
    this.flush();
}

BufferedStream.prototype.end = function () {
    this.emit('end');
}

exports.BufferedStream = BufferedStream;
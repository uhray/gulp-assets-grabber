'use strict';

var through = require('through'),
    gutil = require('gulp-util'),
    fs = require('fs'),
    path = require('path');

module.exports = function (opts, rep) {

    opts = opts || {};
    opts.js = 'js' in opts ? opts.js : true;
    opts.css = 'css' in opts ? opts.css : false;
    rep = rep || function(d) { return d; };

    function findJavascriptResources(htmlStr) {
        var buildTag = typeof opts.js === 'string' ? opts.js : 'js',
            BUILD_REGEX = new RegExp('<!-- build:' + buildTag + ' -->([\\s\\S]*?)<!-- endbuild -->', 'g'),
            JS_REGEX = /<script.*?src=(?:'|")(.*?)(?:'|")/g,
            buildStr = BUILD_REGEX.exec(htmlStr),
            resultsArray = [],
            matchArray;

        while (matchArray = JS_REGEX.exec(buildStr === null ? htmlStr : buildStr[1])) {
            resultsArray.push(matchArray[1]);
        }

        return resultsArray;
    }

    function findCSSResources(htmlStr) {
        var buildTag = typeof opts.css === 'string' ? opts.css : 'css',
            BUILD_REGEX = new RegExp('<!-- build:' + buildTag + ' -->([\\s\\S]*?)<!-- endbuild -->', 'g'),
            CSS_REGEX = /<link.*?href=(?:'|")(.*?\.css)(?:'|")/gi,
            buildStr = BUILD_REGEX.exec(htmlStr),
            resultsArray = [],
            matchArray;

        while (matchArray = CSS_REGEX.exec(buildStr === null ? htmlStr : buildStr[1])) {
            resultsArray.push(matchArray[1]);
        }

        return resultsArray;
    }

    return through(function (file) {
        if (!(file.contents instanceof Buffer)) {
            return this.emit('error', new gutil.PluginError('gulp-assets', 'Streams not supported'));
        }

        var htmlContent = String(file.contents),
            currentStream = this,
            filesSrc = [];

        if (opts.js) {
            filesSrc = filesSrc.concat(findJavascriptResources(htmlContent));
        }

        if (opts.css) {
            filesSrc = filesSrc.concat(findCSSResources(htmlContent));
        }

        filesSrc.forEach(function (fileSrc) {
            var filePath = rep(fileSrc);

            if(fs.existsSync(filePath)) {
                currentStream.queue(new gutil.File({
                    base: file.base,
                    cwd: file.cwd,
                    path: filePath,
                    contents: fs.readFileSync(filePath)
                }));
            }
        });
    });
};

module.exports.js = function(tag, fn) {
    return this({ css: false, js: typeof tag === 'undefined' ? true : tag }, fn);
};

module.exports.css = function(tag, fn) {
    return this({ css: typeof tag === 'undefined' ? true : tag, js: false }, fn);
};

(function () {
    'use strict';

    var minifyTag = require('../index.js');
    var fs = require('fs');
    var assert = require('assert');
    var Promise = require('es6-promise').Promise;

    function deleteFile(file) {
        return new Promise(function (resolve, reject) {
            fs.unlink(file, function (err) {
                if (!err) console.log('deleted: ' + file);
                resolve();
            });
        });
    }

    function clean() {
        return deleteFile('demo/__abc.prod.html')
            .then(function () {
                return deleteFile('demo/_abc.min.css')
            })
            .then(function () {
                return deleteFile('demo/_abc.min.js')
            })
            .then(function () {
                return deleteFile('demo/_abc.prod.html')
            })
            .then(function () {
                return deleteFile('demo/_index1.prod.html')
            })
            .then(function () {
                return deleteFile('demo/_abc1.min.js')
            })
            .then(function () {
                return deleteFile('demo/_abc1.min.css')
            })
            .then(function () {
                return deleteFile('demo/_abc2.min.js')
            })
            .then(function () {
                return deleteFile('demo/_abc2.min.css')
            });

    }

    function callTest1() {
        console.info('Start 1...');
        return new Promise(function (resolve, reject) {
            minifyTag.minify({
                    relativeBaseDir: "test/demo",
                    htmlIn: "abc.dev.html",
                    htmlOut: "__abc.prod.html",
                    encoding: "utf8",
                    mergeNgIncludes: true
                },
                function (err, msg) {
                    if (err) return reject(err);
                    resolve(msg);
                });
        });
    }

    function callTest2() {
        console.info('Start 2...');
        return new Promise(function (resolve, reject) {
            minifyTag.minifyByGlob({
                    relativeBaseDir: "test/demo",
                    filePattern: "**/*.dev.html"
                },
                function (err, msg) {
                    if (err) return reject(err);
                    resolve(msg);
                });
        });
    }


    clean()
        .then(callTest1)
        .then(callTest2)
        .catch(function(error) {
            console.error("Failed!", error);
        });


})();
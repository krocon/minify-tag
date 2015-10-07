(function () {
    'use strict';


    var compressor = require('node-minify');
    var fs = require('fs');
    var path = require('path');
    var program = require('commander');
    var glob = require("glob");

    module.exports = minifyTag.minify = minifyTag;

    minifyTag.minifyByGlob = function minify(options, callback) {
        console.log('minifyTag.minifyByGlob...');
        console.log('    __dirname: ' + __dirname);
        console.log('    options.relativeBaseDir: ' + options.relativeBaseDir + ' -> isAbsolute: ' + path.isAbsolute(options.relativeBaseDir));

        //    var options = {
        //        relativeBaseDir: program.relativeBaseDir, // "../../hi/",
        //        filePattern : program.filePattern, // "**/*.dev.html"
        //        silent : program.silent // 
        //    };

        if (!options.relativeBaseDir) return console.error("Error: options.relativeBaseDir missing.");
        if (!options.filePattern) return console.error("Error: options.filePattern missing.");

        var BASE_DIR = path.isAbsolute(options.relativeBaseDir) ? path.normalize(options.relativeBaseDir) : path.join(__dirname, options.relativeBaseDir);

        var pattern = BASE_DIR + options.filePattern;
        //var pattern = options.relativeBaseDir + options.filePattern;
        if (!options.encoding) options.encoding = 'utf8';

        if (!options.silent) console.info("    Glob: " + pattern);

        glob(pattern, {}, function (err, files) {
            if (err) return callback(err, "Error: Cannot read " + pattern);

            console.log('    Files found: ' + files.length);

            var todos = [];
            for (var i = 0; i < files.length; i++) {
                console.log("    File: " + files[i]);

                (function(f){
                    todos.push(f);
                    processFileByGlob(f, options, function(err, msg) {
                        if (removeFromArray(todos, f).length===0) {
                            callback(err, msg);
                        }
                    });
                })(files[i]);
            }
        });
    };

    minifyTag.minify = function minify(options, callback) {
        console.log('minifyTag.minify...');

        var BASE_DIR = path.isAbsolute(options.relativeBaseDir) ? path.normalize(options.relativeBaseDir) : path.join(__dirname, options.relativeBaseDir);
        var htmlIn = path.isAbsolute(options.htmlIn) ? options.htmlIn : path.join(BASE_DIR, options.htmlIn);
        var htmlOut = path.isAbsolute(options.htmlOut) ? options.htmlOut : path.join(BASE_DIR, options.htmlOut);


        console.log('    options.relativeBaseDir: ' + options.relativeBaseDir + ' -> isAbsolute: ' + path.isAbsolute(options.relativeBaseDir));
        console.log('    __dirname: ' + __dirname);
        console.log('    htmlIn: ' + htmlIn);
        console.log('    htmlOut: ' + htmlOut);
        console.log("    mergeNgIncludes: " + options.mergeNgIncludes);

        //console.log('html out path: ' + path.dirname(htmlOut));

        var encoding = options.encoding ? options.encoding : "utf8";


        fs.readFile(htmlIn, encoding, function (err, data) {
            if (err) return callback(err, "Error: Cannot read " + htmlOut);

            // replace content between <!-- begin() --> and <!-- end() --> token:
            var pat = /<!--\s*node-minify-tag\s*\(([^]*?)\)\s*-->([^]*?)<!--\s*node-minify-tag-end\s*-->/gm;
            var minifyJobs = [];

            // Parse complete file:
            var result = data.replace(pat, function (match, $1, $2, $3, $4) {

                // Analyse next hit:
                var o = JSON.parse(RegExp.$1); // json argument for begin(...).
                var content = RegExp.$2;       // content between begin and end.

                // remove html comments:
                content = content.replace(/<!--[\\s\\S]*?(?:-->)?<!---+>?'|<!(?![dD][oO][cC][tT][yY][pP][eE]|\[CDATA\[)[^>]*>?|<[?][^>]*>?/g, '');
                // remove JSP comments:
                content = content.replace(/<%--[\\s\\S]*?(?:--%>)?<%---+>?'|<%(?![dD][oO][cC][tT][yY][pP][eE]|\[CDATA\[)[^>]*>?|<[?][^>]*>?/g, '');

                if (o.fileOut.indexOf('.js') === o.fileOut.length - 3) {
                    // the replacement (script tag):
                    return processScriptTags(BASE_DIR, htmlOut, o, content, minifyJobs);
                }
                if (o.fileOut.indexOf('.css') === o.fileOut.length - 4) {
                    // the replacement (link tag):
                    return processStyleTags(BASE_DIR, htmlOut, o, content, minifyJobs);
                }

                var errorMsg = "Error: could not process " + o.fileOut;
                console.error(errorMsg);
                //callback(errorMsg, htmlOut);

                return "<!-- " + errorMsg + " -->";

                // next hit...
            });


            if (options.mergeNgIncludes) {
                var pat2 = /<ng-include\s*src="([^\"]*?)"\s*><\/ng-include>/gm;
                result = result.replace(pat2, function (match, $1, $2, $3, $4) {
                    var src = RegExp.$1.replace(/'/g, '').replace(/"/g, '');
                    return fs.readFileSync(path.join(BASE_DIR, src));
                });
            }

            fs.writeFile(htmlOut, result, encoding, function (err) {
                if (err) return callback(err, "Cannot write " + htmlOut);

                var todos = [];
                for (var i = 0; i < minifyJobs.length; i++) {
                    (function (job) {
                        todos.push(job);
                        job.fileOut = path.join(BASE_DIR, job.fileOut);
                        job.fileIn = job.urls;
                        job.callback = function (err, min) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log('    ' + job.type + ' done: ' + job.fileOut);
                            }
                            removeFromArray(todos, job);
                            console.log('    todos: ' + todos.length);
                            if (todos.length === 0) {
                                console.info('    All ready.');
                                callback(false, "All done");
                            }
                        };
                        new compressor.minify(job);

                    })(minifyJobs[i]);
                }
            });
        }); // read file.
    };

    minifyTag();

    // -----------------------------------------------------------------------------------
    function minifyTag() {
        console.log('m i n i f y T a g ()');
        console.log(process.argv);

        // check, if there is a command call like:   node.exe node-minify-tag-glob.js -d ../../hi/ -p **/*.dev.html
        program
            .version('0.0.1')
            .option('-d, --relativeBaseDir [relativeBaseDir]', 'Specify base dir [../../hi/]')
            .option('-p, --filePattern [filePattern]', 'Specify glob pattern [**/*.dev.html]', '**/*.dev.html')

            .option('-i, --htmlIn [htmlIn]', 'Specify htmlIn [abc.html]', 'abc.html')
            .option('-o, --htmlOut [htmlOut]', 'Specify htmlOut [abc.prod.html]', 'abc.prod.html')

            .option('-g, --glob', 'Set glob mode')
            .option('-m, --mergeNgIncludes', 'Set merge ng-includes')
            .option('-s, --silent', 'Set silent mode')
            .parse(process.argv);

        var options = {
            relativeBaseDir: program.relativeBaseDir, // "../../hi/",
            filePattern: program.filePattern, // "**/*.dev.html"
            mergeNgIncludes: program.mergeNgIncludes,
            silent: program.silent
        };
        if (program.relativeBaseDir) {
            if (program.glob) {
                options.relativeBaseDir = program.relativeBaseDir; // "../../hi/",
                options.filePattern = program.filePattern; // "**/*.dev.html"

                minifyTag.minifyByGlob(options, defaultHandler);

            } else if (program.htmlIn && program.htmlOut) {
                options.htmlIn = program.htmlIn;
                options.htmlOut = program.htmlOut;

                minifyTag.minify(options, defaultHandler);
            }
        }
    }
    
    function defaultHandler(err, msg) {
        if (err) {
            console.error(err);
        } else {
            console.log(msg);
        }
    }
    
    function processFileByGlob(htmlIn, options, callback) {
        console.log('processFileByGlob...');

        fs.readFile(htmlIn, options.encoding, function (err, data) {
            if (err) return callback(err, htmlIn);

            var todos = [];
            var pat = /<!--\s*node-minify-tag-glob\s*\(([^]*?)\)\s*-->/gm;
            var result = data.replace(pat, function (match, $1, $2, $3, $4) {
                // Analyse next hit:
                var o = JSON.parse(RegExp.$1);
                var opt = {
                    relativeBaseDir: options.relativeBaseDir,
                    mergeNgIncludes: options.mergeNgIncludes,
                    htmlIn: htmlIn,
                    htmlOut: o.htmlOut
                };
                if (!options.silent) console.log('    processing ' + htmlIn);
                if (!options.silent) console.log(JSON.stringify(opt, null, 0));

                (function(opt){
                    todos.push(opt.htmlOut);
                    minifyTag.minify(opt, function(err, res){
                        if (removeFromArray(todos, opt.htmlOut).length ===0) {
                            console.log('  JAU  ');
                            callback(false, res);
                        }
                    });
                })(opt);

                return '';
            });
            if (result===data) callback(false, '');
        });
    }

    function removeFromArray(arr, o){
        var index = arr.indexOf(o);
        if (index > -1) arr.splice(index, 1);
        return arr;
    }

    function processScriptTags(BASE_DIR, htmlOut, o, content, minifyJobs) {
        var urls = [];
        var untouchableUrls = [];
        var found = content.replace(/<script\s*src="([^]*?)"><\/script>/gm, function () {
            var url = RegExp.$1;
            if (url.indexOf('//') !== 0 && url.indexOf('http') !== 0) {
                urls.push(path.join(BASE_DIR, url));
            } else {
                console.log("Warning: This url is untouchable: " + url);
                untouchableUrls.push(url);
            }
            return '';
        });
        // console.log('found: ' + found);

        o.urls = urls;
        minifyJobs.push(o);

        // relative path from generated HTML file to generated JS file:
        var relativeSrc = path.relative(
            path.dirname(htmlOut),
            path.dirname(path.join(BASE_DIR, o.fileOut))
        );
        var baseName = path.basename(o.fileOut);
        var pre = '<script src="';
        var post = '"></script>';
        var untouchableStr = untouchableUrls.length ?
            (pre + untouchableUrls.join(post + '\n' + pre) + post) :
            '';
        var scriptStr = pre + relativeSrc + baseName + post;
        //console.log('relativeSrc:' + relativeSrc);
        //console.log('untouchableStr:' + untouchableStr);
        //console.log('scriptStr:' + scriptStr);

        // the replacement (script tag)
        return untouchableStr + '\n' + scriptStr;
    }

    function processStyleTags(BASE_DIR, htmlOut, o, content, minifyJobs) {
        var urls = [];
        var untouchableUrls = [];
        var found = content.replace(/<link([^]*?)href="([^]*?)\.css"([^]*?)>/gm, function () {
            var url = RegExp.$2 + '.css';
            if (url.indexOf('//') !== 0 && url.indexOf('http') !== 0) {
                urls.push(path.join(BASE_DIR, url));
            } else {
                console.log("Warning: This url is untouchable: " + url);
                untouchableUrls.push(url);
            }
            return '';
        });
        // console.log('found: ' + found);

        o.urls = urls;
        minifyJobs.push(o);

        // relative path from generated HTML file to generated JS file:
        var relativeSrc = path.relative(
            path.dirname(htmlOut),
            path.dirname(path.join(BASE_DIR, o.fileOut))
        );
        var baseName = path.basename(o.fileOut);
        var pre = '<link href="';
        var post = '" rel="stylesheet">';
        var untouchableStr = untouchableUrls.length ?
            (pre + untouchableUrls.join(post + '\n' + pre) + post) :
            '';
        var scriptStr = pre + path.join(relativeSrc, baseName) + post;
        //console.log('relativeSrc:' + relativeSrc);
        //console.log('untouchableStr:' + untouchableStr);
        //console.log('scriptStr:' + scriptStr);

        // the replacement (script tag)
        return untouchableStr + '\n' + scriptStr;
    }


})();
# minify-tag

Minifier of js, css, html. 

It is a wrapper for the gorgeous [node-minify](www.npmjs.com/package/node-minify).

You can use it programmatic [as script](#asscript) or as [CLI](#ascli).  

Advantage / Motivation: Instead of separate mapping files and html code the needed informations can be set with help of html comments:
```html
<html>
<head>
    <!-- node-minify-tag-glob( {"htmlOut": "_index1.prod.html"} ) -->
    ...
    <title>index1</title>
    ...
    <!-- node-minify-tag( {"fileOut":"_abc1.min.css", "type": "no-compress"} ) -->
    <link href="css/base.css" rel="stylesheet">
    <link href="css/base2.css" rel="stylesheet">
    <!-- node-minify-tag-end -->
</head>
<body>
...
<!-- node-minify-tag( {"fileOut":"_abc.min.js", "type": "no-compress"} ) -->
    <script src="js/jquery-2.0.3.js"></script>
    <script src="js/base.js"></script>
    <script src="js/base2.js"></script>
<!-- node-minify-tag-end -->
...
```
 

## Usage
### As script <a name="asscript"></a>:
```js
var minifyTag = require('node-minify-tag');

// HTML in and out file are explicitly specified: 
// No need for 'node-minify-tag-glob' tag:
minifyTag.minify({
        relativeBaseDir: "demo",
        htmlIn: "abc.dev.html",
        htmlOut: "__abc.prod.html",
        encoding: "utf8",
        mergeNgIncludes: true
    }, 
    function (err, msg){
        if (err) return reject(err);
        resolve(msg);
    });


// Glob mode: 
// minifyByGlob walk through the sub directories 
// and looks for all file matching 'filePattern'.
// The 'htmlOut' file for each 'htmlIn' must be specified 
// in an 'node-minify-tag-glob' comment tag
minifyTag.minifyByGlob({
        relativeBaseDir: "../../Xy/",
        filePattern: "**/*.dev.html",
        encoding: "utf8",
        mergeNgIncludes: true
    }, 
    function (err, msg){
        if (err) return reject(err);
        resolve(msg);
    });
```


#### HTML comment attributes
Comment tag                      | Corresponding comment tag  | Options
-------------------------------- | ---------------------------|---------
node-minify-tag( options )       | node-minify-tag-end        | see below
node-minify-tag-glob( options )  | none                       | {"htmlOut": "sample.prod.html"}

#### Options node-minify-tag

Key    | Possible values       | Action  | File type
-------|-----------------------|---------|----------
type   | 'no-compress' | concatenation of files | JS / CSS
type   | 'gcc' | Google Closure Compiler | JS
type   | 'yui-js' | YUI Compressor | JS
type   | 'yui-css' | YUI Compressor | CSS
type   | 'uglifyjs' | UglifyJS | JS
type   | 'sqwish' | Sqwish  | CSS
type   | 'clean-css' | Clean-css  | CSS
type   | 'csso' | CSSO   | CSS
fileOut| <String> name of generated (compressed) html or CSS file | - | -



#### Options node-minify-tag-glob

Key      | Possible values                      | Example
---------|--------------------------------------|-------------------
htmlOut  | <String> name of generated html file | 'index.prod.html'




### As CLI <a name="ascli"></a>

```
node node_modules/node-minify-tag/index.js -h

// Explicit mode:
node node_modules/node-minify-tag/index.js -d test/demo/ -i abc.html -o __abc.prod.html 

// glob mode:
node node_modules/node-minify-tag/index.js -g -d test/demo/ -p **/*.dev.html
```

Information about glob file pattern can be found here: [Glob Primer](www.npmjs.com/package/glob#glob-primer).
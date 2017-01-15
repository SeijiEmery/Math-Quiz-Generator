

// Try parsing a given regex.
// If matches calls success( next_text, matched_args )
// If fails   calls fail( text, regex )
function parseRegex (regex, text, success, fail) {
    var match = regex.exec(text);
    if (match) {
        success(text.substr(match[0].length), match.slice(1));
    } else {
        fail(text, regex);
    }
}

function Range (min, max) {
    this.min = min;
    this.max = max;
}

function parseQuizMarkup (text) {
    var lines = text.split("\n").map(function(line){
        return line.split("#")[0];
    });

    // var indentLevel = [];
    // var prevIndent  = 0;
    var lineNum = -1;
    lines.forEach(function(line){
        ++lineNum;

        // Count leading whitespace
        var i = 0, level = 0, TAB_INDENT = 4;
        while (1) {
            if (line[i] === ' ') 
                ++i, ++level;
            else if (line[i] === '\t') 
                ++i, level += TAB_INDENT;
            else break;
        }
        // Get rid of prev / end whitespace
        line = line.slice(i).trimRight();
        
        // Skip empty lines
        if (!line) return;

        // Ignore this, may use it later
        // if (level > prevIndent) {}
        // else if (level < prevIndent) {}
        // else {}

        // Strip 'wrapping' characters -- like "[Fubar]", "--Baz--", or "'''thing'''"
        // iff wrapping (ie. str[0] == lchr && str[str.length-1] == rchr),
        // and return the number of levels stripped.
        function stripWrappingChrs (lchr, rchr) {
            var i = 0, n = line.length;
            while (line[i] == lchr && line[n-(i+1)] == rchr) ++i;
            if (i) {
                // console.log(lchr+rchr+i+line[i]+line[n-i-1]);
                line = line.substr(i, n - i * 2); // Note: is substr(start,length) NOT substr(start, end)
            }
            return i;
        }

        if (level === 0) {
            // No indent level -- is label
            if (stripWrappingChrs('[', ']')) {
                beginGroup(line);
            } else if (level = stripWrappingChrs('-', '-')) {
                enterNamespace(line, level);
            } else {
                beginLabel(line);
            }
        } else {
            parseRegex(/^(\w+)\s*/, line, parseTermExpr, parseError("Expected directive"));
        }
    });
    function parseError (msg) {
        return function (text, regex) {
            console.log("ParseError (line "+lineNum+", offset "+lines[lineNum].indexOf(text)+"): "+msg+
                "\n\t'"+text+"' did not match '"+regex+"'")
        }
    }
    function semanticError (msg, text) {
        console.log("SemanticError (line "+lineNum+", offset "+lines[lineNum].indexOf(text)+"): "+msg+
            "\n\t'"+text+"'")
    }
    function parseTermExpr (text, args) {
        switch (args[0]) {
            case "add": parseOpDirective('+', text); break;
            case "sub": parseOpDirective('-', text); break;
            case "mul": parseOpDirective('*', text); break;
            case "div": parseOpDirective('/', text); break;
            case "ordered": applySetting('ordered', true); break;
            case "total":   
                parseNumericRange(text, 
                    applySetting.bind(null, 'constraint_total'),
                    // function (value) { applySetting('constraint_total', value); }, 
                    parseError("Expected number / interval")); 
                break;
            default: semanticError("Unsupported directive '"+args[0]+"'", text);
        }
    }
    function parseNumericRange (text, success, fail) {
        parseRegex(/^(\d+)(?:\s*[-,]\s*(\d+))?/, text, function(_, args) {
            if (args[1]) success({ min: parseInt(args[0]), max: parseInt(args[1]) });
            else         success(parseInt(args[0]));
        }, fail);
    }
    function parseArg (text, success, fail) {
        parseRegex(/^(?:([\[\(])\s*(\-?\d*)\s*[,-]\s*(\-?\d*)\s*([\]\)])|([-\+]?[0-9]+)|([+-]?[A-Z]+)|([a-z]\w*)|)\s*/, text,
            //          ^ arg0     ^ arg1            ^ arg2     ^ arg3   ^ arg4          ^ arg5        ^ arg6
            function (text, args) {
                // if (args[0] == '[' || args[0] == '(') {
                if (args[0]) {
                    success(text, {
                        name: '',
                        value: {
                            min: (args[1] ? parseInt(args[1]) : NaN) + (args[0] == '('),
                            max: (args[2] ? parseInt(args[2]) : NaN) + (args[3] != ')'),
                        },
                    });
                } else if (args[4]) {
                    var x = parseInt(args[4]);
                    success(text, { 
                        name: '', 
                        value: x
                    })
                } else if (args[5]) {
                    var neg = args[5][0] == '-';
                    if (neg || args[5][0] == '+') args[5] = args[5].slice(1);
                    success(text, {
                        name:'', 
                        value: {
                            min: neg ? -Math.pow(10, args[5].length) : 0,
                            max: Math.pow(10, args[5].length)
                        }
                    });
                } else if (args[6]) {
                    success(text, {
                        name: args[6],
                        value: undefined
                    })
                }
            },
            fail);
    }

    // We are _fully_ embracing deep recursion here xD
    function parseTermArg (text, success, fail) {
        parseArg(text, function (text, value) {
            if (text[0] == ':') { // Parse constraints
                if ((typeof value.constraints) !== 'object')
                    value.constraints = {};

                (function parseConstraints (text) {
                    parseRegex(/^(odd|even|prime)/, text, function(text, args){

                        // Set constraint (this gets used in the solver)
                        value.constraints[args[0]] = true;

                        // Recurse or succeed (constraints may be comma delimited)
                        if (text[0] != ',') 
                            success(text.trimLeft(), value);
                        else parseConstraints(text);
                    
                    }, function () {
                        parseArg(text, function(text, v){
                            value.value = v.value;

                            if (text[0] != ',')
                                success(text.trimLeft(), value);
                            else parseConstraints(text);

                        }, fail);
                    });
                })(text.slice(1));
                
            } else {
                success(text, value);
            }
        }, fail);
    }

    function parseOpDirective (op, text) {
        // console.log("Parsing directive '"+op+"': '"+text+"'");

        var result = { op: op };
        // console.log("Parsing 1st arg: '"+text+"'")
        parseTermArg(text, function (text, value){
            result.a = value;
            // console.log("Parsing 2nd arg: '"+text+"'")
            parseTermArg(text, function(text, value){
                result.b = value;
                if (text[0] == '=') {
                    // console.log("Parsing 3rd arg: '"+text+"'")
                    parseTermArg(text.slice(1).trimLeft(), function(text, value){
                        // console.log("3rd arg: "+value+", rem: '"+text+"'");
                        result.r = value;
                        maybeParseQty(text);
                    }, parseError("While parsing 3rd argument"));
                } else {
                    maybeParseQty(text);
                }
                function maybeParseQty (text) {
                    // console.log("final: "+text);
                    if (text[0] == 'x') {
                        parseNumericRange(text.slice(1), function(value){ result.qty = value; },
                            parseError("Expected range / quantity"));
                    } else if (text) {
                        console.log("Unparsed text: '"+text+"' "+
                            "(from line "+lineNum+", '"+lines[lineNum]+"')")
                    }
                }
            }, parseError("While parsing 2nd argument"));
        }, parseError("While parsing 1st argument"));


        function repr (x) {
            switch (typeof x) {
                case 'string': return x;
                case 'number': return ''+x;
                case 'object': switch (typeof x.value) {
                    case 'undefined': return x.name || '_';
                    case 'number':    return ''+x.value;
                    case 'object':    return (x.name ? x.name + ":" : '') + "["+x.value.min+","+x.value.max+")";  
                }
            }
        }


        console.log(repr(result.a)+" "+result.op+" "+repr(result.b)+
            " = "+repr(result.r)+", qty = "+repr(result.qty))
        // console.log("\n\t"+JSON.stringify(result.a))
        // console.log("\n\t"+JSON.stringify(result.b))
        // console.log("\n\t"+JSON.stringify(result.r));
        // console.log('\n\t'+JSON.stringify(result))
        // console.log("Parsed directive '"+op+"', got "+JSON.stringify(result));
    }

    function applySetting (key, value) {
        console.log("Setting '"+key+"' = '"+value+"'")
    }
    function beginGroup (name) { console.log("Group: '"+name+"'")}
    function enterNamespace (name, level) { console.log("Namespace ("+level+"): '"+name+"'")}
    function beginLabel (name) { console.log("Label: '"+name+"'")}
}














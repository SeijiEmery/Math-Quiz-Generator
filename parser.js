

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



function parseQuizMarkup (text) {
    var lines = text.split("\n").map(function(line){
        return line.split("#")[0];
    });

    // var indentLevel = [];
    // var prevIndent  = 0;
    var lineNum = 0;
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
            parseRegex(/(\w+)\s*/, line, parseTermExpr, parseError("Expected directive"));
        }
    });
    function parseError (msg) {
        return function (text, regex) {
            console.log("ParseError (line"+lineNum+", offset"+lines[lineNum].indexOf(text)+"): "+msg+
                "\n\t'"+text+"' did not match '"+regex+"'")
        }
    }
    function semanticError (msg, text) {
        console.log("SemanticError (line"+lineNum+", offset"+lines[lineNum].indexOf(text)+"): "+msg+
            "\n\t'"+text+"'")
    }
    function parseTermExpr (text, args) {
        switch (args[0]) {
            case "add": parseOpDirective('+', text); break;
            case "sub": parseOpDirective('-', text); break;
            case "mul": parseOpDirective('*', text); break;
            case "div": parseOpDirective('/', text); break;
            case "ordered": applySetting('ordered', true); break;
            case "total":   applySetting('constraint_total', parseNumericRange(text)); break;
            default: semanticError("Unsupported directive '"+args[0]+"'", text);
        }
    }
    function parseNumericRange (text) {
        return 1;
    }


    function parseOpDirective (op, text) {
        console.log("Parsing directive '"+op+"': '"+text+"'");
    }

    function applySetting (key, value) {
        console.log("Setting '"+key+"' = '"+value+"'")
    }
    function beginGroup (name) { console.log("Group: '"+name+"'")}
    function enterNamespace (name, level) { console.log("Namespace ("+level+"): '"+name+"'")}
    function beginLabel (name) { console.log("Label: '"+name+"'")}
}














// Quiz model. Includes description (.text), used by generator.html,
// and gen() (produces html math string), used by display.html. 
var quiz_model=[
    {
        section: "Math: Simple Addition (Kindergarten)"
    },{
        text: "a + 0, 1 digit",
        gen:  add_n(0,10, 0)
    },{
        text: "a + 1, 1 digit",
        gen:  add_n(0,10, 1)
    },{
        text: "a + 2, 1 digit",
        gen:  add_n(0,10, 2)
    },{
        text: "a + 3, 1 digit",
        gen:  add_n(0,10, 3)
    },{
        text: "a + b >= 4, 1 digit",
        gen:  add_ab(0,10, 4,10)
    },{
        text: "1-3 + 0-20",
        gen:  add_ab(1,3, 0,20)
    },{
        text: "1-3 + 20-50",
        gen:  add_ab(1,3, 20,50)
    },{
        text: "1-3 + 50-100",
        gen:  add_ab(1,3, 50,100)
    },{
        section: "Math: Addition (1st)"
    },{
        text: "2 digit a + 1 digit b",
        gen: add_ab(2,1)
    },{
        text: "2 digit a + 2 digit b",
        gen: add_ab(2,2)
    },{
        text: "2 digit a + 2 digit b",
        gen: add_ab(2,2)
    },{
        section: "3-digit addition"
    },{
        text: "3 digit a + 1 digit b",
        gen: add_ab(3,1) 
    },{
        text: "3 digit a + 2 digit b",
        gen: add_ab(3,2)
    },{
        text: "3 digit a + 3 digit b",
        gen: add_ab(3,3)
    },{
        section: "4-digit addition"
    },{
        text: "3 digit a + 2 digit b, result between [100, 250]",
        gen: constrain_result(100,251, add_ab(0,1000, 0,100))
    }
];

// Add constraint
function constrain_result (x_min, x_max, fcn, limit) {
    limit = limit || 50;   // retry at most N iterations
    return function () {
        for (var i = limit; i --> 0; ) {
            var x = fcn();
            if (x.result < x_min || x.result >= x_max) continue; // retry
            else break;
        }
        return x;
    }
}

// Addition a + n = ?, where
//  a: random number bounded by a_min, a_max
//  n: constant number (0, 1, 2, etc).
//
function add_n (a_min, a_max, n) {
    return function () {
        var a = (Math.random() * (a_max - a_min) + a_min)|0;
        return new AdditionProblem(a, n);
    }
}

// Addition a + b = ?, where
//  a: random number bounded by a_min, a_max
//  b: random number bounded by b_min, b_max
//
function add_ab (a_min, a_max, b_min, b_max) {
    return function () {
        var a = (Math.random() * (a_max - a_min) + a_min)|0;
        var b = (Math.random() * (b_max - b_min) + b_min)|0;
        return new AdditionProblem(a, b);
    }
}

function ArithmeticProblem (op, a, b) {
    this.op = op;
    if (!this.isCommutative || Math.random() >= 0.5)
        this.a = a, this.b = b;
    else
        this.a = b, this.b = a;
    this.result = eval(''+this.a+op+this.b);
}
ArithmeticProblem.prototype.equals = function (other) {
    return this.op == other.op && this.a == other.a && this.b == other.b;
}
ArithmeticProblem.prototype.genMathML = function () {
    return "<mn>"+this.a+"</mn> <mo>"+this.op+"</mo> <mn>"+this.b+"</mn> <mo>=</mo> ";
}

Function.prototype.subclass = function (parent, properties) {
    this.prototype = Object.create(parent.prototype);
    this.prototype.constructor = this;
    for (var k in properties)
        this.prototype[k] = properties[k];
    return this;
}


function AdditionProblem (a, b) {
    ArithmeticProblem.apply(this, ['+', a, b]);
}
AdditionProblem.subclass(ArithmeticProblem, {
    isCommutative: true
});

(function SubtractionProblem (a, b) {
    ArithmeticProblem.apply(this, ['-', a, b]);
}).subclass(ArithmeticProblem, { isCommutative: false });

(function MultiplicationProblem (a, b) {
    ArithmeticProblem.apply(this, ['*', a, b]);
}).subclass(ArithmeticProblem, { isCommutative: true });

(function DivisionProblem (a, b) {
    ArithmeticProblem.apply(this, ['/', a, b]);
}).subclass(ArithmeticProblem, { isCommutative: false });


// Display functions
function display_generate (div, input) {

    // Generate selection of items from input.levels (must be Array + match quiz_model!)
    var items = [];
    for (var i = 0; i < input.levels.length; ++i) {

        // Check that i refers to valid quiz_model element, and skip if it doesn't
        if (i >= quiz_model.length) break;
        if (!quiz_model[i].gen) continue;

        // Generate n items for this level (or none if zero)
        for (var count = input.levels[i]; count --> 0; ) {

            // Generate, and check that each item is unique
            var maxAttempts = 100;
            do {
                var item = quiz_model[i].gen();

                var isUnique = true;
                for (var j = items.length; j --> 0; ) {
                    if (item.equals(items[j])) {
                        isUnique = false;
                        break;
                    }
                }
            } while (!isUnique && maxAttempts --> 0);

            items.push(quiz_model[i].gen());
        }
    }

    // http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
    function shuffle(array) {
        var counter = array.length;

        // While there are elements in the array
        while (counter > 0) {
            // Pick a random index
            var index = Math.floor(Math.random() * counter);

            // Decrease counter by 1
            counter--;

            // And swap the last element with it
            var temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }
        return array;
    }

    if (input.randomize)
        shuffle(items);

    // Generate HTML + add to page
    items.forEach(function(item){
        var elem = document.createElement("p");
        elem.innerHTML = '<math xmlns="http://www.w3.org/1998/Math/MathML">'+
            item.genMathML()+'</math>'
        div.appendChild(elem);
    });
}


// Form functions
function form_generate (div) {
    var levels = [];

    for (var i = 0; i < quiz_model.length; ++i) {
        levels.push(0);

        var item = quiz_model[i];
        if (item.section) {
        
            var elem = document.createElement("p");
            elem.innerHTML = item.section;
            div.appendChild(elem);
        
        } else {
            (function () { 
                var span = document.createElement("span");
                span.innerHTML = '<label for="'+i+'">'+item.text+' </label>';

                var ib = document.createElement("input");
                ib.type  = 'number';
                ib.value = ib.min = 0;

                var ir = document.createElement("input");
                ir.type = 'range';
                ir.value = ir.min = 0; ir.max = 20;

                span.appendChild(ib);
                span.appendChild(ir);
                span.appendChild(document.createElement("br"));
                div.appendChild(span);

                var n = i;
                ib.oninput = function () { levels[n] = ir.value = ib.value; }
                ir.oninput = function () { levels[n] = ib.value = ir.value; }  
            })(); 
        }
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.innerText = "Generate";
    btn.onclick = function () {
        window.open("./display.html?gen=["+levels+"]", "_blank").focus()
    }
    div.appendChild(btn);
}








// Quiz model. Includes description (.text), used by generator.html,
// and gen() (produces html math string), used by display.html. 
var quiz_model=[
    {
        section: "simple addition"
    },{
        text: "a + 1, sum < 20",
        gen: add_1(1000,2000)
    },{
        text: "a + 1, sum < 100",
        gen: add_1(0,100)
    },{
        text: "1 digit, a + b, sum < 10",
        gen: add_ab(1,1, 0,10)
    },{
        text: "1 digit, a + b, sum >= 10",
        gen: add_ab(1,1, 10,20)
    },{
        text: "a + 0 and 0 + a, sum < 20",
        gen: add_0(0,20)
    },{
        text: "a + 0 and 0 + a, sum < 100",
        gen: add_0(0,100)
    },{
        section: "2-digit addition"
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
    }
];

function add_1 (min_sum, max_sum) {
    return function () {
        var n = (Math.random() * (max_sum - min_sum) + min_sum)|0;
        return gen_add_scramble(1, n);
    }
}
function add_0 (min_sum, max_sum) {
    return function () {
        var n = (Math.random() * (max_sum - min_sum) + min_sum)|0;
        return gen_add_scramble(0, n);
    }
}

// Addition problem:
//  min/max a, b: non-optional numeric limits for the 2 arguments
//  min/max sum:  optional numeric constraint on sum of 2 numbers
//
function add_ab (a_min, a_max, b_min, b_max, sum_min, sum_max) {
    return function () {
        var a, b;
        do {
            a = (Math.random() * (a_max - a_min) + a_min)|0;
            b = (Math.random() * (b_max - b_min) + b_min)|0;
        } while (
            (sum_min !== undefined && (a + b) < sum_min) ||
            (sum_max !== undefined && (a + b) >= sum_max)
        );
        return gen_add_scramble(a, b);
    }
}

// Randomly selects either (a, b) or (b, a) and passes arguments
// to gen_add. Result is gen_add_scramble(0, 1) will produce
// either '1 + 0' or '0 + 1'.
//
function gen_add_scramble (a, b) {
    return Math.random() > 0.5 ?
        gen_add(a, b) :
        gen_add(b, a);
}

// Generates math html for an addition problem
function gen_add (a, b) {
    return "<mn>"+a+"</mn> <mo>+</mo> <mn><mn>"+b+"</mn> <mo>=</mo>";
}


// Display functions
function display_generate (div, input) {

    // window.alert("baz");

    // Generate selection of items from input.levels (must be Array + match quiz_model!)
    var items = [];
    for (var i = 0; i < input.levels.length; ++i) {

        // Check that i refers to valid quiz_model element, and skip if it doesn't
        if (i >= quiz_model.length) break;
        if (!quiz_model[i].gen) continue;

        // Generate n items for this level (or none if zero)
        for (var count = input.levels[i]; count --> 0; ) {
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
        elem.innerHTML = item; 
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








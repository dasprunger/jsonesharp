//
// DOM register management routines
//

var new_register = function(n) {

    var id = 'register_'.concat(n.toString());
    var grp_id = 'form_group_'.concat(id);
    
    var grp = $('<div>');
    grp.attr('class', 'form-group');
    grp.attr('id', grp_id);
    
    var col2 = $('<div>');
    col2.attr('class', 'col-sm-9');

    var col3 = $('<div>');
    col3.attr('class', 'col-sm-2');

    var textarea = $('<textarea>');
    textarea.attr('class', 'form-control register');
    textarea.attr('rows', '1');
    textarea.attr('id', id);
    
    var label = $('<label>');
    label.attr('class', 'control_label col-sm-1');
    label.attr('for', id);
    label.html('R'.concat(n.toString()));

    var button = $('<button>');
    button.attr('type', 'button');
    button.attr('class', 'btn btn-default clear_register');
    button.html('clear');
    button.click(function () { $( '#'.concat(id) ).val(''); });
    
    col2.append(textarea);
    col3.append(button);
    grp.append(label);
    grp.append(col2);
    grp.append(col3);

    return grp;
};

var update_register_buttons = function(m) {

    $('#add_register').html('add R'.concat(m.toString()));
    $('#remove_register').html('remove R'.concat((m-1).toString()));
    if (m==2) {
	// Disable remove register button when there's only one register
	$('#remove_register').prop("disabled", true);
    }
    else {
	$('#remove_register').prop("disabled", false);
    }
};

var extend_registers = function(n) {

    var m = $('.register').length + 1;

    while (m <= n) {
	$('#rm').append(new_register(m));
	m++;
    }

    update_register_buttons(m);
};

var add_one_register = function() {

    extend_registers($('.register').length + 1);
};

var remove_last_register = function() {

    var m = $('.register').length;

    if (m > 1) {
	var sel = '#'.concat('form_group_register_'.concat(m.toString()));
	$(sel).remove();
	update_register_buttons(m);
    }
};

//
// functions for copying registers stored in an array (starting at
// index 1) to DOM and back.
//

var dom_regs_to_array = function() {

    var dom_regs = $('.register')
    var regs = [[]];

    var id = '';
    var i = 0;
    while (i < dom_regs.length) {
	id = '#register_'.concat((i+1).toString());
	regs.push($(id).val().split(''));
	i++;
    }
    
    return regs;
};

var array_to_dom_regs = function(regs) {

    var m = $('.registers').length
    
    if (regs.length < m) {
	while (regs.length < m) {
	    remove_last_register();
	    m--;
	}
    }
    else {
	extend_registers(regs.length-1);
    }

    var id = '';
    var i = 1;
    while (i < regs.length) {
	id = '#register_'.concat(i.toString()); 
	$(id).val(regs[i].join(''));
	i++;
    }
};

//
// Program preprocessing routines
//

var clean = function(p) {

    // This should remove comments starting with a semi-colon and
    // ending at a line break or at the end of p
    p = p.replace(/;[^\n\f\r]*[\n\f\r]/g, '');
    p = p.replace(/;.*$/, '');

    // This should remove everything that is not a 1 or a #
    p = p.replace(/[^1#]/g, '');
    
    return p;
};

var parse_ones_hashes = function(p, pos) {

    var n_ones = 0;
    var n_hashes = 0;

    while (pos < p.length && p[pos]=='1') {
        n_ones++;
        pos++;
    }
    while (pos < p.length && p[pos]=='#' && n_hashes < 5) {
        n_hashes++;
        pos++;
    }

    return [n_ones, n_hashes, pos]
};

var parse = function(p) {

    var parsed = [];
    var inst = [0, 0, 0];
    var n_ones = 0;
    var n_hashes = 0;
    var pos = 0
    var new_pos = 0;

    while (pos < p.length) {

	inst = parse_ones_hashes(p, pos);
	n_ones = inst[0];
	n_hashes = inst[1];
	new_pos = inst[2];
	
	if (n_ones==0 || n_hashes==0) {
	    break;
	}
	
	parsed.push([n_ones, n_hashes]);
	pos = new_pos;
    }
    
    return [pos, parsed];
};

//
// Button events and states
//

var clear_program = function() {

    $('#program').val('')
};

var eval_button_ready = function() {

    $('#interrupt').prop('disabled', true);
    $('#interrupt').off('click');
    $('#evaluate').prop('disabled', false);
};

var evaluate = function() {

    $('#evaluate').prop('disabled', true);
    $('#interrupt').prop('disabled', false);

    // Parse program
    var p = $('#program').val();
    p = clean(p);
    var parsed = parse(p);
    var parser_pos = parsed[0];
    if (parser_pos < p.length) {
	console.log('1# syntax error');
	return;
    }
    p = parsed[1]

    // Move dom registers to array
    var regs = [[]];
    regs = dom_regs_to_array(regs);

    // Start worker and make kill button active
    var thread = new Worker('jsonesharp-worker.js');
    $('#interrupt').click(function() {

	eval_button_ready();
	thread.terminate();
    });
    thread.onmessage = function(e) {

	console.log('Halting at instruction '.concat(e.data[0].toString()));
	array_to_dom_regs(e.data[1]);
	eval_button_ready();
    };
    thread.postMessage([p, regs]);
};

//
// main
//

$(document).ready(function() {

    extend_registers(1);
    eval_button_ready();

    $('#remove_register').click(remove_last_register);
    $('#add_register').click(add_one_register);
    $('#clear_program').click(clear_program);
    $('#evaluate').click(evaluate);
});

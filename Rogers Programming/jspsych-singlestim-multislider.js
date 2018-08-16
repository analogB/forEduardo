/**
 * jspsych-survey-multi-choice
 * a jspsych plugin for multiple choice survey questions using slider inputs
 *
 * Brad Rogers
 */

jsPsych.plugins['singlestim-multislider'] = (function() {
  var plugin = {};

  plugin.trial = function(display_element, trial) {

    var plugin_id_name = "jspsych-singlestim-multislider";
    var plugin_id_selector = '#' + plugin_id_name;
    var _join = function( /*args*/ ) {
      var arr = Array.prototype.slice.call(arguments, _join.length);
      return arr.join(separator = '-');
    }

    // trial defaults
    trial.stimPreamble =  typeof trial.stimPreamble == 'undefined' ? "" : trial.stimPreamble;
    trial.radioPreamble =  typeof trial.radioPreamble == 'undefined' ? "" : trial.radioPreamble;
    // trial.sliderPreamble =  typeof trial.sliderPreamble == 'undefined' ? "" : trial.sliderPreamble;

    // if any trial variables are functions this evaluates the function and replaces it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // form element
    var trial_form_id = _join(plugin_id_name, "form");
    display_element.append($('<form>', {
      "id": trial_form_id
    }));
    var $trial_form = $("#" + trial_form_id);

    // show preamble text
    var stimPreamble_id_name = _join(plugin_id_name, 'stimPreamble');
    $trial_form.append($('<div>', {
      "id": stimPreamble_id_name,
      "class": stimPreamble_id_name
    }));
    $('#' + stimPreamble_id_name).html(trial.stimPreamble) + '<br>';

    if (!trial.is_html) {
      $trial_form.append($('<img>', {
        src: trial.stimulus,
        id: 'jspsych-singlestim-multichoice-slider-stimulus'
      }));
    } else {
      $trial_form.append($('<div>', {
        html: trial.stimulus,
        id: 'jspsych-singlestim-multichoice-slider-stimulus'
      }));
    }

    // show preamble text
    var radioPreamble_id_name = _join(plugin_id_name, 'radioPreamble');
    var sliderPreamble_id_name = _join(plugin_id_name, 'sliderPreamble');
    $trial_form.append($('<div>', {
      "id": radioPreamble_id_name,
      "class": radioPreamble_id_name
    }));
    $('#' + radioPreamble_id_name).html(trial.radioPreamble) + '<br>'; //enter a break if no radio preamble
    $('#' + sliderPreamble_id_name).html(trial.sliderPreamble) + '<br>';
    // add multiple-choice questions--only one question per page
      var i = 0;
      // create question container
      var question_classes = [_join(plugin_id_name, 'question')];
      if (trial.horizontal) {
        question_classes.push(_join(plugin_id_name, 'horizontal'));
      }

      $trial_form.append($('<br>'));

      $trial_form.append($('<div>', {
        "id": _join(plugin_id_name, i),
        "class": question_classes.join(' ')
      }));

      var question_selector = _join(plugin_id_selector, i);

      // create option labels for sliders
      $trial_form.append($('<form> oninput="total.value=parseInt()"'));

      // initialize slider parameters
      var len = trial.options[i].length;
      var arr = createArray(len);
      var sliderMin = 0.1;
      var sliderMax = 100-sliderMin*(len-1);
      var initial = Math.round(100/len);
      var sliderValues=[]
      for (k=0; k<len; k++){
        sliderValues.push(initial);
      };

      // create slider array
      function createArray(length) {
      	var array = [];
      	for (var i = 0; i < length; i++) {
      		array.push({ val: initial, slider: null, disp: null});
      	};
      	return array;
      };

      // create sliders
      for(var j=0; j<len; j++) {
        var option_id_name = _join(plugin_id_name, "option", i, j)
        var option_id_selector = '#' + option_id_name;
        $(question_selector).append($('<div>', {
          "id": option_id_name,
          "class": _join(plugin_id_name, 'option')
        }));

        // add labels and question text
        var option_label = '<label class="' + plugin_id_name + '-text">' + trial.options[i][j] + '  </label>';
        $(option_id_selector).append(option_label);

        var slider_name = _join('slider',j);
        var slider_display_name = _join(slider_name,'display');

      	arr[j].slider = $('<input/>', {id:slider_name, type:'range', step: 0.1, width: 250, min:sliderMin, max:sliderMax}).appendTo(option_id_selector + " label")
        arr[j].disp = $('<output/>',{id:slider_display_name,type:'text', val:initial}).appendTo(option_id_selector + " label")
      	arr[j].val = initial

        $('<div>').appendTo(option_id_selector + " label")
      };

      //update slider display values
      function update_sliders() {
        sliderValues=[]
      	arr.forEach(function(el) {
      		el.slider.val(Math.round(el.val));
      		el.disp.text(Math.round(el.val) + '%');
          sliderValues.push(Math.round(el.val));
      	});
      };

      update_sliders();

      //couple sliders so that they self adjust to sum to 100
      arr.forEach(function(el, j) {
      	el.slider.on('input', function() {
      		el.val = +el.slider.val();
      		var newrest = 100-el.val;
      		var oldrest = 0;
      		for (var k=0; k<len; k++) {
      			if (arr[k] == el) continue;
      			oldrest = oldrest + arr[k].val; //sum other elements
      		}
      		for (var k=0; k<len; k++) {
      			if (arr[k] == el) continue;
      			arr[k].val = newrest/oldrest * arr[k].val; //allocate rest over other elements
      		};
      		update_sliders();
      	});
      });

      //track which slider was last manipulated
      var lastInput = []
      arr.forEach(function(el,j) {
        el.slider.on('input',function(){
          for (var k=0; k<len; k++){
            if (arr[k] == el){
            lastInput = k};
          };
        });
      });

    // add submit button
    $trial_form.append($('<div><p>'));
    $trial_form.append($('<input>', {
      'type': 'submit',
      'id': plugin_id_name + '-next',
      'name': plugin_id_name + '-next',
      'class': plugin_id_name + ' jspsych-btn',
      'value': 'Submit Answers',
      'disabled':true,
      'style': 'background-color:LightGrey; color:Grey',
    }));

    //enable submit button once sliders have been clicked
    arr.forEach(function(el, j) {
      el.slider.on('input', function() {
        document.getElementById( plugin_id_name + "-next").removeAttribute('disabled');
        document.getElementById( plugin_id_name + "-next").removeAttribute('style');
      });
      el.slider.on('click',function(){
        document.getElementById( plugin_id_name + "-next").removeAttribute('disabled');
        document.getElementById( plugin_id_name + "-next").removeAttribute('style');
      });
    });

    $trial_form.submit(function(event) {

    event.preventDefault();

    // measure response time
    var endTime = (new Date()).getTime();
    var response_time = endTime - startTime;

    // create object to hold responses
    var question_data = {};
    $("div." + plugin_id_name + "-question").each(function(index) {
      var id = "Q" + index;
      var val = $(this).find("input:radio:checked").val();
      var obje = {};
      obje[id] = val;
      $.extend(question_data, obje);
    });

    // save data
    var trial_data = {
        "rt": response_time,
        "lastInput": lastInput,
        "responseA": sliderValues[0],
        "responseB": sliderValues[1],
        "responseC": sliderValues[2],
        "responseD": sliderValues[3],
        "responseE": sliderValues[4],
        "responseF": sliderValues[5],
        "responseG": sliderValues[6],
        "responseH": sliderValues[7],
        "responseI": sliderValues[8],
        "responseJ": sliderValues[9],
          "stringA": trial.conditions[0].stringA,
          "stringB": trial.conditions[0].stringB,
       "randomized": trial.conditions[0].random,
                "N": trial.conditions[0].N,
               "nA": trial.conditions[0].nA,
               "nB": trial.conditions[0].nB,
              "nAB": trial.conditions[0].nAB,
               "pA": trial.conditions[0].pA,
               "pB": trial.conditions[0].pB,
              "pAB": trial.conditions[0].pAB,
         "anchored": trial.conditions[0].anchored
        };

      display_element.html('');

      // next trial
      jsPsych.finishTrial(trial_data);
    });

    var startTime = (new Date()).getTime();
  };

  return plugin;
})();

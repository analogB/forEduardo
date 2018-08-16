0/**
 * jspsych-mine-text
 * a jspsych plugin that creates mine area histograms
 *
 * Brad Rogers
 *
 *
 */


jsPsych.plugins['mine-text'] = (function() {
  var plugin = {}

  plugin.trial = function(display_element, trial) {
    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawChart);

    var plugin_id_name = "jspsych-mine-text";
    var plugin_id_selector = '#' + plugin_id_name;
    var _join = function( /*args*/ ) {
      var arr = Array.prototype.slice.call(arguments, _join.length);
      return arr.join(separator = '-');
    }

    // trial defaults
    trial.preamble = typeof trial.preamble == 'undefined' ? "" : trial.preamble;
    trial.randomizeMine = typeof trial.randomizeMine == 'undefined' ? false : trial.randomizeMine;
    trial.legend = typeof trial.legend == 'undefined' ? true : trial.legend;
    trial.mineBlocksWide = typeof trial.mineBlocksWide == 'undefined' ? 40 : trial.mineBlocksWide;
    trial.mineBlocksHigh = typeof trial.mineBlocksHigh == 'undefined' ? 20 : trial.mineBlocksHigh;
    trial.mineScale = typeof trial.mineScale  == 'undefined' ? 0.75 : trial.mineScale ;

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // form element
    var trial_form_id = _join(plugin_id_name, "form");
    display_element.append($('<form>', {
      "id": trial_form_id
    }));
    var $trial_form = $("#" + trial_form_id);

    // show preamble text
    var preamble_id_name = _join(plugin_id_name, 'preamble');
    $trial_form.append($('<div>', {
      "id": preamble_id_name,
      "class": preamble_id_name
    }));
    $('#' + preamble_id_name).html(trial.preamble);

    var mine_classes = [_join(plugin_id_name, 'mine')];

    // add mines
    for (var q = 0; q < trial.composition.length; q++) {
      // create container

      $trial_form.append($('<div>', {
        "id": _join(plugin_id_name, q),
        "class": plugin_id_name
      }));
      var mine_selector = _join(plugin_id_name, q);
      $('#'+mine_selector).append(
        '<p class="' + mine_selector + '-text">' + trial.descript[q] + '</p>'
      );
      makeMine(trial.composition[q],trial.randomizeMine,trial.mineBlocksWide,trial.mineBlocksHigh,trial.mineScale, mine_selector)
    };

    var cont_text_id_name = _join(plugin_id_name, 'cont_text');
    $trial_form.append($('<div>', {
      "id": cont_text_id_name,
      "class": cont_text_id_name
    }));
    $('#' + cont_text_id_name).html(trial.cont_text);

      var after_response = function(info) {
        var trial_data = {
          "rt": info.rt,
          "key_press": info.key
        }
        jsPsych.finishTrial(trial_data);
        display_element.html('')
      };

      // check if key is 'mouse'
      jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.cont_key,
        rt_method: 'date',
        persist: false,
        allow_held_key: false
      });


    function makeMine(composition, randomize,blocksWide,blocksHigh,scale,containerObject){
      var total = composition.reduce(function(total,current){return total + current[1];},0)
      var target= 100;
      while (total != target){
        target = total;
        composition = composition.map(function(x){return [x[0],Math.round(x[1]/total*100)]});
        total = composition.reduce(function(total,current){return total + current[1];},0);
      };

      multiplier = blocksWide * blocksHigh / 100;
      if (randomize){
          var mineHTML=printMine(shuffle(minemaker(composition,multiplier)),blocksWide, blocksHigh, scale, composition,containerObject);;
        } else {
          var mineHTML=printMine(minemaker(composition,multiplier),blocksWide, blocksHigh, scale, composition, containerObject);
      };
    };

    function printMine(resource_list,blocksWide, blocksHigh, scale, composition,containerObject){
      var sheetWidth =  384 * scale;
      var sheetHeight = 512 * scale;
      var spriteWidth =  16 * scale;
      var spriteHeight = 16 * scale;
      var sheetSpritesWide = sheetWidth / spriteWidth;
      var containerSprites = blocksHigh * blocksWide; //should be factor of 100
      var containerHeight = spriteHeight * blocksHigh ;
      var containerWidth = spriteWidth * blocksWide ;

      //Make mineContainer
      var display_element = $('#'+containerObject)
      display_element.append('<table style="vertical-align:top; height:'+containerHeight+'px " display="inline-block" id="'+containerObject+'-container"><tr style="width:'+containerWidth+'px; height:'+containerHeight+'px">'+
      '<td id="piechart'+q+'"                                    style=" vertical-align:top;" display="inline-block"></td>'+
      '<td id="'+containerObject+'-mine"   class="mineContainer" display="inline-block" style="height:'+containerHeight+'px; vertical-align:top; width:'+containerWidth+'px"></td>'+
      '<td id="'+containerObject+'-legend"                       display="inline-block" style="height:'+containerHeight+'px; vertical-align:top; width:auto;"></td></tr></table>')

      var display_container = $('#'+containerObject+'-container');
      var mine = $('#'+containerObject+'-mine');
      var legend = $('#'+containerObject+'-legend');

      for (i=0; i<resource_list.length; i++){
        mine.append(spriteString(resource_list[i],scale))   //Fill Container
      };

      //Make Ledgend
      // legend.append('<table id="'+containerObject+'-legend" style="display:inline-block; width:auto; border:0px solid black"></table>');
      // display_table_rows = $('#'+containerObject+'-legend')
      for (i=0; i<composition.length; i++){
        if (composition[i][1]>0){
          legend.append('<tr style="text-align:left; vertical-align:bottom;"><td>'+spriteString(composition[i][0],1.25)+'</td><td>'+composition[i][0]+'</td><td>'+composition[i][1]+'%</td></tr>');
        }
      }
    };

    function drawChart() {
        for (var q = 0; q < trial.composition.length; q++) {
          var charthead = [['mineral','percent']]
          var data = google.visualization.arrayToDataTable(charthead.concat(trial.composition[q].map(el => el.slice(0,2))));
          var options = {'title':'Chance of finding mineral from exploration', 'height':'240','width':'280'};
          var chart = new google.visualization.PieChart(document.getElementById('piechart'+q));
          chart.draw(data, options);
    }
  }

    function shuffle(array){
      var copy_array = array.slice(0);
      var m = copy_array.length,
      t, i;
      while (m) {
        i = Math.floor(Math.random() * m--);
        t = copy_array[m];
        copy_array[m] = copy_array[i];
        copy_array[i] = t;
      };
      return copy_array;
    };

    function minemaker(comp,mult){
      var minedata = [];
      for (i=0; i<comp.length; i++){
        for (j=0; j<comp[i][1]*mult; j++){
          minedata.push(comp[i][0]);
        };
      };
      return minedata;
    };

    function spriteString(resource='grass',scale=1){
      var spriteMapPositions = {
        'grass':1,
        'stone':2,
        'dirt':3,
        'sand':27,
        'gravel':28,
        'gold':49,
        'iron':50,
        'coal':51,
        'diamond':75,
        'redstone':76,
        'lapislazuli':241,
        'emerald':252
      };
      var sheetname = 'img/sprites.png'
      var sheetWidth =  384 * scale;
      var sheetHeight = 512 * scale;
      var spriteWidth =  16 * scale;
      var spriteHeight = 16 * scale;
      var sheetSpritesWide = sheetWidth / spriteWidth;
      var index =  spriteMapPositions[resource];
      var ypos = Math.floor((index-1)/sheetSpritesWide) * spriteWidth
      var xpos = ((index-1) % sheetSpritesWide) * spriteHeight
      spriteOnSheet = '<img width="'+sheetWidth+'px" height="'+sheetHeight+'px" oncontextmenu="return false" ondragstart="return false" style="margin: -'+ypos+'px 0px 0px -'+xpos+'px;"src='+sheetname+'>'
      framedSprite = '<div class="mineItem" resource="'+resource+'" style="width:'+spriteWidth+'px; height:'+spriteHeight+'px;align:left">'+spriteOnSheet+'</div'
      return framedSprite
    }
  }
  return plugin;
})();

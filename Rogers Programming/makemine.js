function makeMine(composition, randomize,blocksWide,blocksHigh,scale){
  var total = composition.reduce(function(total,current){return total + current[1];},0)
  var target= 100;
  while (total != target){
    target = total;
    composition = composition.map(function(x){return [x[0],Math.round(x[1]/total*100)]});
    total = composition.reduce(function(total,current){return total + current[1];},0);
  };

  multiplier = blocksWide * blocksHigh / 100;
  if (randomize){
      var mineHTML=printMine(shuffle(minemaker(composition,multiplier)),blocksWide, blocksHigh, scale, composition);;
    } else {
      var mineHTML=printMine(minemaker(composition,multiplier),blocksWide, blocksHigh, scale, composition);
  };
  return mineHTML
};

function printMine(resource_list,blocksWide, blocksHigh, scale, composition){
  var sheetWidth =  384 * scale;
  var sheetHeight = 512 * scale;
  var spriteWidth =  16 * scale;
  var spriteHeight = 16 * scale;
  var sheetSpritesWide = sheetWidth / spriteWidth;
  var containerSprites = blocksHigh * blocksWide; //should be factor of 100
  var containerHeight = spriteHeight * blocksHigh ;
  var containerWidth = spriteWidth * blocksWide ;

  //Make mineContainer
  var display_element = $('body')
  display_element.append('<div class="mineContainer" style="height:'+containerHeight+'px; width:'+containerWidth+'px;"></div>')

  var container = $('.mineContainer');   //Make mineContainer
  for (i=0; i<resource_list.length; i++){
    container.append(spriteString(resource_list[i],scale))   //Fill Container
  };

  //Make Ledgend
  display_table = $('.mineContainer')
  display_table.append('<table style="display:inline-block; width:auto; border:1px solid black"></table>');
  display_table_rows = $('table')
  for (i=0; i<composition.length; i++){
    if (composition[i][1]>0){
      display_table_rows.append('<tr style="text-align:center"><td>'+spriteString(composition[i][0],1.25)+'</td><td>'+composition[i][0]+'</td><td>'+composition[i][1]+'%</td></tr>');
    }
  }
  return container
};

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
  framedSprite = '<div class="mineItem" resource="'+resource+'" style="width:'+spriteWidth+'px; height:'+spriteHeight+'px; ">'+spriteOnSheet+'</div'
  return framedSprite
}

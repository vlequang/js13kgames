/*
    SHORT CIRCUIT  - created for http://js13kgames.com/
    Author: Vincent Le Quang
    https://onlinesequencer.net/311979
*/


   var audioContext;
   function playMusic() {
     if(!audioContext) {
       audioContext = new AudioContext;
     }
   }

   var nn = [200,300,400,500,600,800,900,1000];
   var osc = [];
   var oscValue = 0;
   var notes = [];
   var noteIndex = 0;
   var lastNote = 0;
   var stopMusicTimeout = null;
   var changeTune = false;
   function playNote() {
     clearTimeout(stopMusicTimeout);
     playMusic();
     if(lastRefresh-lastNote>180) {
        lastNote = lastRefresh;
        if(!notes[noteIndex] || changeTune && Math.random()<.3) {
           notes[noteIndex] = nn[parseInt(Math.random()*nn.length)];
           changeTune = false;
        }
        if(oscValue != notes[noteIndex]) {
            if(oscValue) osc[oscValue].disconnect();
            oscValue = notes[noteIndex];
            if(!osc[oscValue]) {
              osc[oscValue] = audioContext.createOscillator();
              osc[oscValue].frequency.value = oscValue;
              osc[oscValue].start(0);
            }
            osc[oscValue].connect(audioContext.destination);
        }
        noteIndex= (noteIndex+1)%8;
     }
     stopMusicTimeout = setTimeout(stopMusic,100);
   }
   function stopMusic() {
     var oscillator = osc[oscValue];
     if(oscillator)
        oscillator.disconnect();
     notes = [];
   }


   function restart() {
      elems = getMap(level);
   }

   function promptRestart() {
      stopMusic(); 
      if(confirm('Restart level?')) {
         restart();
      }
   }

   function resize(e) {
     var retina = isRetina ();
     
     var scale = retina?.5:1;
     var maxRect = Math.min(window.innerWidth, window.innerHeight-50);
     var goodSize = Math.min(800,Math.max(240,Math.floor(maxRect/10)*10));
     var innerSize = retina?2*goodSize:goodSize;
     if(canvas.width != innerSize) {
        
        canvas.style.width = canvas.style.height = goodSize+"px";
        canvas.width = canvas.height = innerSize;
        ctx.scale(scale,scale);
        refreshView();
      
        refreshPad();
     }
   }

   function getMap(index) {
     var elements = [];
     var maps = document.getElementsByTagName("map");
     if(index-1>=maps.length) {
         return null;
     }
     var lines = maps[index-1].innerHTML.split(String.fromCharCode(10)).filter(line=>line.trim()!="");
     for(var y=0;y<lines.length;y++) {
        for(var x=0;x<lines[y].length/2;x++) {
           var cell = lines[y].substr(x*2,2);
           var elem = null;
           switch(cell.charAt(0)) {
              case 'X':
                 elem = {type:'hole', x:x, y:y};
                 elem.floor = true;
                 elem.block = true;
                 addCircuit(elem,cell);
                 break;
              case '^':
                 elem = {type:'hero', x:x, y:y};
                 elem.type = 'hero'; elem.dx = elem.dy = 0;
                 break;
              case 'D':
                 elem = {type:'door', x:x, y:y};
                 elem.block = true;
                 elem.floor = true;
                 addCircuit(elem,cell);
                 break;
              case 'F':
                 elem = {type:'floor', x:x, y:y};
                 elem.floor = true;
                 addCircuit(elem,cell);
                 break;
              case 'R': // rock
                 elem = {type:'boulder', x:x, y:y};
                 addCircuit(elem,cell);
                 break;
              case 'B':
                 elem = {type:'block', x:x, y:y};
                 elem.block = true;
                 addCircuit(elem,cell);
                 break;
              case 'E':
                 elem = {type:'block', x:x, y:y};
                 elem.block = true;
                 elem.energy = true;
                 addCircuit(elem,cell);
                 break;
           }
           if(elem) elements.push(elem);
        }
     }
     return elements;
   }

   function addCircuit(elem,cell) {
      var circuit = parseInt(cell.charAt(1),16);
      if(circuit && !isNaN(circuit)) {
          elem.circuit = circuit;
      }
   }

   var elems = [];
/*
   var elems = [
      { type:'hole', x: 9, y:9, floor:true },
      { type:'hole', x: 0, y:9, floor:true },
      { type:'hole', x: 9, y:0, floor:true },
      { type:'hole', x: 0, y:0, floor:true },
      { type:'hero', x: 1, y:1, dx:0, dy:0 },
      { type:'block', x: 5, y: 5, block: true },
      { type:'block', x: 4, y: 5, block: true, circuit:2, energy:true },
      { type:'boulder', x: 6, y: 6, circuit: 10},
      { type:'boulder', x: 3, y: 6, circuit: 12},
      { type:'door', x:2, y:2, block: true, circuit:8, floor:true },
      { type:'floor', x:3, y:3, floor: true, circuit:3 },
      { type:'floor', x:4, y:2, floor: true, circuit:9 },
      { type:'floor', x:2, y:3, floor: true, circuit:6 },
      { type:'boulder', x: 3, y: 4, circuit: 10},
   ];
*/
   var level = 1;



   var key= {};
   var active = true;
   var canvas = document.getElementById('view');
   var cellSize = canvas.width/10;
   var ctx = canvas.getContext('2d');
   var canvas2 = document.getElementById('controls-portrait');
   var ctx2 = canvas2.getContext ('2d');
   var steps = 0;
   

   var lastRefresh = 0;

   function refreshView(timestamp) {
      var retina = isRetina ();
     
      var scale = retina?.5:1;
      cellSize = canvas.width/10/scale;
      
      if(timestamp-lastRefresh > 1000/60) {
         lastRefresh = timestamp;
         ctx.clearRect(0,0,cellSize*10,cellSize*10);

         for(var y=0;y<10;y++) {
           for(var x=0;x<10;x++) {
               refreshCell(x,y);
           }
         }
         refreshElems(elems.filter(elem => elem.floor));
         refreshElems(elems.filter(elem => !elem.floor));
         refreshPad();
      }
      if(active) {
         window.requestAnimationFrame(refreshView);
      }
      playNote();
   }

   function refreshPad() {
       var retina = isRetina ();
     
     var scale = retina?.5:1;
       var portrait = window.innerWidth < window.innerHeight;
       document.getElementById("touchControls").style.display = is_touch_device() && portrait ?"":"none";
       document.getElementById("notouch").style.display = !is_touch_device()?"":"none";
       document.getElementById("controls-landscape").style.display = is_touch_device() && !portrait?"":"none";
       canvas2 = document.getElementById(portrait?
          'controls-portrait':'controls-landscape');
       canvas2.width = canvas2.height = scale* canvas.width/8*5;
       ctx2 = canvas2.getContext ('2d');

       var unit = canvas2.width/50;
       ctx2.fillStyle = '#555555';
       ctx2.beginPath ();
       ctx2.arc (25*unit, 10*unit, 8*unit, 0, 2*Math.PI, true);
       ctx2.moveTo (10*unit,25*unit);
       ctx2.arc (10*unit, 25*unit, 8*unit, 0, 2*Math.PI, true);
       ctx2.moveTo (40*unit, 25*unit);
       ctx2.arc (40*unit, 25*unit, 8*unit, 0, 2*Math.PI, true);
       ctx2.moveTo (25*unit, 40*unit);
       ctx2.arc (25*unit, 40*unit, 8*unit, 0, 2*Math.PI, true);
       ctx2.fill ();

       var restartButton = document.getElementById("restartButton");
       restartButton.style.display = is_touch_device()?"":"none";
       restartButton.style.left = restartButton.style.posLeft =
          (window.innerWidth-restartButton.offsetWidth-20)+"px";
   }

   function refreshElems(elems) {
      for(var i=0; i<elems.length; i++) {
         switch(elems[i].type) {
            case 'hero':
               refreshHero(elems[i]);
               break;
            case 'block':
               refreshBlock(elems[i]);
               break;
            case 'door':
               refreshDoor(elems[i]);
               break;
            case 'boulder':
               refreshBoulder(elems[i]);
               break;
            case 'floor':
               refreshFloor(elems[i]);
               break;
            case 'hole':
               refreshHole(elems[i]);
               break;
         }
      }
   }

   function refreshBlock(block) {
      ctx.fillStyle = "rgb("+200 + Math.round(Math.random()*50)+",0,230)";
      ctx.fillRect (1+block.x*cellSize , 1+block.y*cellSize , cellSize-2, cellSize-2);
      drawEnergy(block);
      drawCircuit(block, '#116600',5,.5);
      drawCircuit(block, block.connected?'#00ffff':'#33ff00',3);
   }

   function refreshBoulder(boulder) {
      if(boulder.pushed) {
         boulder.pushed = false;
         if(!boulder.moving) {
            boulder.moving = true;
            checkConnect(boulder);
         }
      } else {
        var dx = (Math.max(0,Math.min(9,Math.round(boulder.x))) - boulder.x)/2;
        var dy = (Math.max(0,Math.min(9,Math.round(boulder.y))) - boulder.y)/2;
        if (dx*dx + dy*dy < .001) {
          if(boulder.moving) {
             boulder.moving = false;
             boulder.x = Math.round(boulder.x);
             boulder.y = Math.round(boulder.y);
             checkConnect(boulder);
          }
        } else {
          boulder.x += dx;
          boulder.y += dy;
        }
      }

      var margin = cellSize /5;
      ctx.fillStyle = "rgb("+100 + Math.round(Math.random()*30)+",100,30)";
      ctx.fillRect (margin+boulder.x*cellSize , margin+boulder.y*cellSize , cellSize-2*margin, cellSize-2*margin);
      drawEnergy(boulder);
      drawCircuit(boulder, '#116600',5,.5);
      drawCircuit(boulder, boulder.connected?'#00ffff':'#33ff00',3);
   }

   function refreshDoor(door) {
      drawEnergy(door);
      drawCircuit(door, '#116600',4,.5);
      drawCircuit(door,door.connected?'#00ffff':'#33ff00',2);

      var x = door.x * cellSize;
      var y = door.y * cellSize;
      ctx.fillStyle = "#00ffff";
      ctx.beginPath();
      ctx.moveTo(x+10,y+cellSize-10);
      ctx.lineTo(x+cellSize-10,y+cellSize-10);
      ctx.lineTo(x+cellSize/2,y+10);
      ctx.fill();

      ctx.fillStyle = "#336600";
      ctx.beginPath();
      var a= door.connected? Math.max(0, 1-(lastRefresh-door.connected)/150) :1;
      ctx.moveTo(x+(10)*a + (cellSize/2)*(1-a),y+(cellSize-10)*a + (10)*(1-a));
      ctx.lineTo(x+(cellSize-10)*a+ (cellSize/2)*(1-a),y+(cellSize-10)*a + (10)*(1-a));
      ctx.lineTo(x+cellSize/2,y+10);
      ctx.fill();
      if(door.block && a==0) {
          door.block= false;
      } else if(a!=0 && !door.block) {
          door.block= true;
      }

      if(door.connected) {
         var rand = parseInt(Math.random()*250);
         ctx.fillStyle= `rgb(255,${rand},30)`;
         ctx.beginPath();
         ctx.moveTo(x+cellSize/2, y - cellSize*rand/500);
         ctx.lineTo(x+cellSize/2-cellSize/5, y-cellSize/4 - cellSize*rand/500);
         ctx.lineTo(x+cellSize/2+cellSize/5, y-cellSize/4 - cellSize*rand/500);
         ctx.fill();
      }
   }

   function refreshDirty() {
      while(dirty.length) {
      }
   }

   function getMove(key, hero) {
      var dx = 0, dy = 0;
      if(key[37]) dx--;
      if(key[39]) dx++;
      if(key[38]) dy--;
      if(key[40]) dy++;

      if (!dx && !dy && !steps) {
         dx = hero.dx; dy = hero.dy;
      }

      return [dx, dy];
   }

   function getElemsAt(x,y) {
      return elems.filter((elem) => Math.round(elem.x)==x && Math.round(elem.y)==y );
   }
   
   function canGo(hero, x, y, pushed) {
      if(x<0 || y<0 || x>9 || y>9) {
         return false;
      }
      x = Math.round(x);
      y = Math.round(y);

      var curX = Math.round(hero.x);
      var curY = Math.round(hero.y);
      var dx = x - hero.x;
      var dy = y - hero.y;

      var elements = getElemsAt(x, y);
      for(var i=0;i<elements.length;i++) {
          var elem = elements[i];
          if(elem.type==='hero') {
             continue;
          }
          if(elem.block) {
             return false;
          }
          if(pushed && elem!=hero && elem.type=='boulder') {
             return false;
          }
          if(!pushed && elem.type=='boulder') {
             var pushx = dx;
             var pushy = dy;
             if (Math.abs(elem.x - hero.x) > Math.abs(elem.y - hero.y)) {
                pushy = 0;
             } else {
                pushx = 0;
             }
             if(!canGo(elem, x + pushx, y + pushy, true)) {
                 return false;
             }
          }
      }
      return true;
   }

   function limit(x, min, max) {
      return x<min? min : x>max? max : x;
   }

   function push(x,y,dx,dy) {
      var orgx = x;
      var orgy = y;
      x = Math.round(x+dx);
      y = Math.round(y+dy);
      for(var i=0;i<elems.length;i++) {
         var elem = elems[i];
         if(Math.round(elem.x)==x && Math.round(elem.y)==y) {
            if(elem.type=='boulder') {
               if (Math.abs(elem.x - orgx) > Math.abs(elem.y - orgy)) {
                  dy = 0;
               } else {
                  dx = 0;
               }
               
               if(canGo(elem, elem.x + dx, elem.y + dx, true)) {
                  elem.x = limit(elem.x + dx, 0, 9);
                  elem.y = limit(elem.y + dy, 0, 9);
                  elem.pushed = true;
                  return true;
               } else {
                  return false;
               }
            }
         }
      }
      return true;
   }

   function refreshHero(hero) {
        var orgPos = {x:Math.round(hero.x),y:Math.round(hero.y)};
        var [dx, dy] = getMove(key,hero);
        if(hero.exit) {
            dx = 0; dy = 0;
        }
        var maxspeed = .12;
        hero.dx = dx<0 ? Math.max(hero.dx-.05, -.12) : 
                  dx>0 ? Math.min(hero.dx+.05, .12) :
                  hero.dx / 3;
        hero.dy = dy<0 ? Math.max(hero.dy-.05, -.12) : 
                  dy>0 ? Math.min(hero.dy+.05, .12) :
                  hero.dy / 3;

        

        dx = dx ? hero.dx : (Math.max(0,Math.min(9,Math.round(hero.x+hero.dx))) - hero.x)/2;
        dy = dy ? hero.dy : (Math.max(0,Math.min(9,Math.round(hero.y+hero.dy))) - hero.y)/2;

        if(!canGo(hero, hero.x+dx, hero.y, false)) {
            dx = 0; hero.dx/=2; steps++;
        }
        if(!canGo(hero, hero.x, hero.y+dy, false)) {
            dy = 0; hero.dy/=2; steps++;
        }

        var success = push(hero.x + dx, hero.y + dy, dx, dy);
        if (!success) {
            dx = 0; hero.dx/=2;
            dy = 0; hero.dy/=2;
            steps++;
        }
        if (Math.abs(hero.dx)+Math.abs(hero.dy)<.01) {
           hero.dx = hero.dy = 0;
           steps = 0;
        } else {
           changeTune= true;
        }


        var heroSize = cellSize/4; 
        var shiftX = dx*(heroSize*1.8);
        var shiftY = dy*(heroSize*1.8);
        hero.x = limit(hero.x + dx, 0, 9);
        hero.y = limit(hero.y + dy, 0, 9);

        if(Math.round(hero.x)!=orgPos.x||Math.round(hero.y)!=orgPos.y) {
           steps++;
        }

        if(!hero.exit) {
           var doors = getElemsAt(Math.round(hero.x),Math.round(hero.y)).filter(elem => elem.type=='door');
           if(doors.length>0) {
              hero.exit = lastRefresh;
           }
        }

        var a= hero.exit? Math.sqrt(Math.max (0,1-(lastRefresh-hero.exit)/250)) :1;
        ctx.strokeStyle = 'rgb(200,150,30)';
        ctx.fillStyle= 'rgb(240,240,30)';
        ctx.lineWidth = heroSize/6;
        ctx.beginPath();
        ctx.arc(hero.x*cellSize + cellSize/2,hero.y*cellSize + (cellSize/2)*a + (cellSize-20)*(1-a),heroSize*a,0,Math.PI*2,true);
        ctx.fill();
        ctx.stroke();
        if(!hero.exit) {
           ctx.beginPath();
           ctx.arc(shiftX+hero.x*cellSize + cellSize/2,shiftY+hero.y*cellSize + cellSize/2,heroSize/1.5,Math.PI*.2,Math.PI*.8,false);
           ctx.stroke();
           ctx.beginPath();
           ctx.arc(shiftX+hero.x*cellSize + cellSize/2 - heroSize/3,shiftY+hero.y*cellSize + cellSize/2-3,heroSize/6,-Math.PI*.1,-Math.PI*.9,true);
           ctx.stroke();
           ctx.beginPath();
           ctx.arc(shiftX+hero.x*cellSize + cellSize/2 + heroSize/3,shiftY+hero.y*cellSize + cellSize/2-3,heroSize/6,-Math.PI*.1,-Math.PI*.9,true);
           ctx.stroke();
        }


        if(hero.exit && a==0 && !hero.out) {
            hero.out = true;
            nextLevel();
        }
   }

   function nextLevel() {
      level++;
      elems = getMap(level);
      console.log("Next level");
      if(!elems) {
          elems = [];
          alert("Game Over");
      }
   }

   function refreshCell(x,y) {
        ctx.fillStyle = "rgb(230,230,230)";
        ctx.fillRect (5+x*cellSize , 5+y*cellSize , cellSize-10, cellSize-10);
   }

   function refreshHole(hole) {
        var x = hole.x;
        var y = hole.y;
        ctx.fillStyle = "#000000";
        ctx.fillRect (x*cellSize , y*cellSize , cellSize, cellSize);
        drawCircuit(hole, '#116600',4,.5);
        drawCircuit(hole, hole.connected?'#00ffff':'#33ff00',2);
   }

   function refreshFloor(floor) {
        var x = floor.x, y = floor.y;
        ctx.fillStyle = "rgb(220,220,230)";
        ctx.fillRect (5+x*cellSize , 5+y*cellSize , cellSize-10, cellSize-10);

        drawEnergy(floor);
        drawCircuit(floor, '#116600',4,.5);
        drawCircuit(floor, floor.connected?'#00ffff':'#33ff00',2);
   }
   
   function drawEnergy(elem) {
        if(!elem.energy) return;
        ctx.strokeStyle = 'rgb(200,200,30)';
        ctx.fillStyle= 'rgb(250,250,30)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(elem.x*cellSize + cellSize/2,elem.y*cellSize + cellSize/2,10,0,Math.PI*2,true);
        ctx.fill();
   }

   function drawCircuit(elem, color,lineWidth, margin) {
        if(!elem.circuit) return;
        if(!margin) margin = 0;
        var x = elem.x, y = elem.y;
        ctx.lineWidth = lineWidth * (isRetina()?2:1);
        ctx.strokeStyle = color;
        ctx.beginPath();
       
        var radius = cellSize/8;
        ctx.arc(elem.x*cellSize + cellSize/2,elem.y*cellSize + cellSize/2,radius,0,Math.PI*2,true);
        

        if(elem.circuit & 1) {
           ctx.moveTo(x*cellSize+cellSize/2-radius,y*cellSize+cellSize/2);
           ctx.lineTo(x*cellSize+margin,y*cellSize+cellSize/2);
        }
        if(elem.circuit & 2) {
           ctx.moveTo(x*cellSize+cellSize/2,y*cellSize+cellSize/2-radius);
           ctx.lineTo(x*cellSize+cellSize/2,y*cellSize+margin);
        }
        if(elem.circuit & 4) {
           ctx.moveTo(x*cellSize+cellSize/2+radius,y*cellSize+cellSize/2);
           ctx.lineTo(x*cellSize+cellSize-margin,y*cellSize+cellSize/2);
        }
        if(elem.circuit & 8) {
           ctx.moveTo(x*cellSize+cellSize/2,y*cellSize+cellSize/2+radius);
           ctx.lineTo(x*cellSize+cellSize/2,y*cellSize+cellSize-margin);
        }
        ctx.stroke();
   }

   function checkConnect(elem) {
        var map = {};
        for(var i=0;i<elems.length;i++) {
           if(elems[i].connected) {
              elems[i].connected = false;
           }
           elems[i].id = i;
        }
        for(var i=0;i<elems.length;i++) {
           if(elems[i].energy) {
              pathToDoor(elems[i]);
           }
        }
   }

   function linked(elem1, elem2) {
      if(elem1.moving || elem2.moving) return false;
      var dx = elem2.x - elem1.x;
      var dy = elem2.y - elem1.y;
      if(dx ==1 && dy==0) {
          return (elem1.circuit&4) && (elem2.circuit&1);
      } else if(dx==-1 && dy==0) {
          return (elem1.circuit&1) && (elem2.circuit&4);
      } else if(dx==0 && dy==1) {
          return (elem1.circuit&8) && (elem2.circuit&2);
      } else if(dx==0 && dy==-1) {
          return (elem1.circuit&2) && (elem2.circuit&8);
      }
      return false;
   }

   function pathToDoor(elem,visited) {
      if(!visited) visited = {};
      if(visited[elem.id]) {
         return false;
      }
      visited[elem.id] = true;
      if(elem.type=='door') {
         elem.connected = lastRefresh;
      }
      var surroundingElems = elems.filter(
         elem2 => elem2.circuit && Math.abs(elem2.x-elem.x)+Math.abs(elem2.y-elem.y)==1
      );
      for(var i=0;i<surroundingElems.length;i++) {
         var surroundingElem = surroundingElems[i];
         if(linked(elem, surroundingElem)) {
             if(pathToDoor(surroundingElem, visited)) {
                elem.connected = true;
             }
         }
      }
      return elem.connected;
   }

  function is_touch_device() {
     return (('ontouchstart' in window)
      || (navigator.MaxTouchPoints > 0)
      || (navigator.msMaxTouchPoints > 0));
  }

  
function isRetina (){
    var mediaQuery = "(-webkit-min-device-pixel-ratio: 2),(min--moz-device-pixel-ratio: 2),(-o-min-device-pixel-ratio: 2),(min-resolution: 2dppx)";
    if (window.devicePixelRatio >= 2)
        return true;
    if (window.matchMedia && window.matchMedia(mediaQuery).matches)
       return true;
    return false;
}



//   refreshView();
   window.onfocus = ()=> {active = true; refreshView();}
   window.onblur = ()=> {active = false;}
   window.onkeyup =  window.onkeydown = 
      e=> { 
         if(!e)e=event;
         if(e.type=="keydown") {
            for(k in key) key[k] = false;
               key[e.keyCode] = true;
         } else {
            key[e.keyCode] = false; 
            if(e.keyCode==27) {
                promptRestart();
            }
         }
         e.preventDefault();
   };
   function touchMe (e) {
     e=e.targetTouches[0];
    // alert (canvas2.offsetLeft);
     var x=e.pageX - canvas2.offsetLeft,
         y=e.pageY - canvas2.offsetTop;
     var unit=canvas2.width/50;
     var ak=[38,37,39,40];
     var pt=[
        {x:25*unit,y:10*unit},
        {x:10*unit,y:25*unit},
        {x:40*unit,y:25*unit},
        {x:25*unit,y:40*unit}
     ];
     for (var i=0;i <pt.length;i++) { 
        var dx=pt[i].x-x;
        var dy=pt[i].y-y;
        var dist=Math.sqrt(dx*dx+dy*dy);
        if (dist <10*unit) {
         key [ak [i]] =true;
        }
     }
   }
   document.addEventListener('touchend',e=> {
       key[37]=key[38]=key[39]=key[40]=false;
   });
document.getElementById('controls-portrait').addEventListener('touchstart',touchMe);
document.getElementById('controls-landscape').addEventListener('touchstart',touchMe);
document.getElementById("restartButton").addEventListener('touchend',
   function(e) {
      promptRestart();
   });
   
   window.addEventListener("resize", resize);
   window.addEventListener("orientationchange", resize);
   resize(); 
   restart();
   playMusic();



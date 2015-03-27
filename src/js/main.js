import Game from './Game';

var canvas = document.getElementById('game-canvas');
if(canvas.getContext){
    Game.initialize(canvas).start();
}else{
    alert('Sorry.Your browser not support canvas technology...');
}
export default {};


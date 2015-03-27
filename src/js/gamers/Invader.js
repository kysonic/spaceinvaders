import Gamer from './Gamer';
import Bomb from './Bomb';
class Invader extends Gamer {
    constructor(game,x,y,w,h){
        super(game,x,y,w,h);
        this.vilocityX = 40;
        this.vilocityY = 0;
        this.img = new Image();
        this.img.onload = ()=>{this.game.ctx.drawImage(this.img, this.x,this.y);};
        this.img.src = './src/images/invader.png';
    }
    fire(stage){
        stage.bombs.push(new Bomb(this.game,this.x,this.y,6,6));
        this.game.sounds.playSound('bang');
    }
    render(){
        this.game.ctx.drawImage(this.img, this.x,this.y);
    }
}

export default Invader;
import Gamer from './Gamer';
import Laser from './Laser';
class Ship extends Gamer {
    constructor(game,x,y,w,h,s){
        super(game,x,y,w,h);
        this.speed = s || 10;
        this.img = new Image();
        this.img.onload = ()=>{this.game.ctx.drawImage(this.img, this.x,this.y);};
        this.img.src = './src/images/ship.png';
    }
    moveLeft(){
        this.x-=this.speed;
    }
    moveRight(){
        this.x+=this.speed;
    }
    fire(stage){
        stage.lasers.push(new Laser(this.game,this.x+13,this.y,2,6));
        this.game.sounds.playSound('shoot');
    }
    render(){
        this.game.ctx.drawImage(this.img, this.x,this.y);
    }
}

export default Ship;
import Gamer from './Gamer';
class Bomb extends Gamer {
    constructor(game,x,y,w,h,s){
        super(game,x,y,w,h);
        this.color = "blue";
        this.speed = s || 8;
    }
}

export default Bomb;
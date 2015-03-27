import Gamer from './Gamer';
class Laser extends Gamer {
    constructor(game,x,y,w,h,s){
        super(game,x,y,w,h);
        this.color = "red";
        this.speed = s || 7;
    }
}

export default Laser;
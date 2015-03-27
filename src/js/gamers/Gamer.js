class Gamer {
    constructor(game,x,y,width,height){
        if(!game) console.error('You forgot send game object.');
        this.game = game;
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 20;
        this.height = height || 20;
        // Default color
        this.color = '#000';
    }

    /**
     * Default render method. Draw a rect.
     */
    render() {
        this.setColor();
        this.game.ctx.fillRect(this.x - (this.width / 2), this.y - (this.height / 2), this.width, this.height);
    }

    /**
     * Colorize.
     */
    setColor(){
        this.game.ctx.fillStyle = this.color;
    }

    /**
     * hitTest - check object collision. Analog AS3 method.
     * @param object - object to check collision.
     * @returns {boolean} - if collide return true
     */
    hitTest(object) {
        return (this.x < object.x + object.width  && this.x + this.width  > object.x && this.y < object.y + object.height && this.y + this.height > object.y);
    }
}

export default Gamer;
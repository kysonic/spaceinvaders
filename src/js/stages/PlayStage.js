import Stage from './Stage';
import EndStage from './EndStage';
import Ship from '../gamers/Ship';
import Invader from '../gamers/Invader';

class PlayStage extends Stage {
    constructor (game,type,invadersCount){
        super(game,type);
        //Events
        this.keyDownSubscription = game.keyDownStream.subscribe(this.keyDownHandler.bind(this),this.errorHandler);
        // Gamers. Ship
        this.ship = new Ship(game,game.width / 2,game.gameBounds.bottom - 20,30,20);
        this.reset();
    }

    /**
     * Reset all game properties before start a new game.
     */
    reset() {
        this.game.scores = 0;
        this.game.lives = 3;
        this.lasers = [];
        this.bombs = [];
        this.invaders = [];
        this.invadersData = {
            lines: 10,
            rows: 5,
            speed: 100,
            velocity: {x:100,y:0},
            nextVelocity: {x:-100,y:0},
            hits: {r:false,b:false,l:false},
            areDropping: false,
            currentDropDistance: 0
        }
        for(var i = 0; i <  this.invadersData.rows; i++){
            for(var j = 0; j < this.invadersData.lines; j++) {
                this.invaders .push(new Invader(this.game,(this.game.width / 2) + ((this.invadersData.lines/2 - j) * 200 / this.invadersData.lines),(this.game.gameBounds.top + 20 + i * 16),18,14));
            }
        }
        return this;
    }
    preRender(){
        this.updateInvaders();
        this.updateLasers();
        this.updateBombs();
        this.gameEndCheck();
    }
    render(){
        this.preRender();
        this.clear();
        this.ship.render();
        this.invaders.forEach((invader)=>invader.render());
        this.lasers.forEach((laser)=>laser.render());
        this.bombs.forEach((bomb)=>bomb.render());
        this.renderInfo();
    }
    /**
     * Update invaders position and state.
     */
    updateInvaders() {
        //Delta t is the time to update/draw.
        var dt = 1/this.game.opts.fps;
        // Reduction for "Invaders Data"
        var id = this.invadersData;
        // Update invaders position
        this.invaders.forEach((invader)=>{
            // Calculate a new position of invader
            var newX = invader.x + id.velocity.x * dt;
            var newY = invader.y + id.velocity.y * dt;
            // Checkout borders
            if(!id.hits.l && newX < this.game.gameBounds.left + 20) {
                id.hits.l = true;
            }
            else if(newX > this.game.gameBounds.right - 20) {
                id.hits.r = true;
            }
            else if(newY > this.game.gameBounds.bottom - 20) {
                id.hits.b = true;
            }

            invader.x = newX;
            invader.y = newY;
        });
        // Check invaders possible states.
        if(id.areDropping) {
            id.currentDropDistance += id.velocity.y * dt;
            if(id.currentDropDistance >= 50) {
                id.areDropping = false;
                id.velocity = id.nextVelocity;
                id.currentDropDistance = 0;
                id.hits.l = false;
                id.hits.r = false;
            }
        }
        if(id.hits.l || id.hits.r) {
            id.velocity = {x: 0, y:id.speed };
            id.areDropping = true;
            id.nextVelocity = {x: id.hits.r ? -id.speed : id.speed , y:0};
        }
        // When invaders was dropped at the bottom - you are lose.
        if(id.hits.b) this.game.lives = 0;
        // Give a chance to invaders
        // Get a random invader
        var invader = this.invaders[Math.round(Math.random()*this.invaders.length)];
        // Check bomb chance.
        if(Math.round(Math.random()*1000)>990) {
            if(invader && invader.fire) invader.fire(this);
        }
    }
    /**
     * Update lasers position and states.
     */
    updateLasers() {
        var dt = 1/this.game.opts.fps;
        this.lasers.forEach((laser,key)=>{
            laser.y-=laser.speed;
            if(laser.y<this.game.gameBounds.top + 20) this.lasers.splice(key,1);
            this.invaders.forEach((invader,k)=>{
                if(laser.hitTest(invader)){
                    this.lasers.splice(key,1);
                    this.invaders.splice(k,1);
                    this.game.sounds.playSound('kill');
                    this.game.scores+=5;
                }
            });
        });
    }
    /**
     * Update bombs position and states.
     */
    updateBombs() {
        var dt = 1/this.game.opts.fps;
        this.bombs.forEach((bomb,key)=>{
            bomb.y+=bomb.speed;
            if(bomb.y>this.game.gameBounds.bottom) this.bombs.splice(key,1);
            if(bomb.hitTest(this.ship)){
                this.bombs.splice(key,1);
                this.game.sounds.playSound('explosion');
                this.game.lives--;
            }
        });
    }
    /**
     * Play Stage Control.
     * @param e - keyboard event.
     */
    keyDownHandler(e) {
        if(e.which==32) {
            this.ship.fire(this);
        }
        if(e.which==37 && this.ship.x>(this.game.gameBounds.left+20)) {
            this.ship.moveLeft();
        }
        if(e.which==39 && this.ship.x<(this.game.gameBounds.right-20)) {
            this.ship.moveRight();
        }
    }
    /**
     * Check end of game condition.
     */
    gameEndCheck() {
        if(this.game.lives===0) {
            this.stop().then(()=>{
                this.game.endMessage = 'lose('
                this.game.addStage(EndStage,'static').reset().render();
            });
        }
        if(this.invaders.length===0) {
            //this.game.endMessage = ' win!';
            //this.game.addStage(EndStage,'static').render();
            this.stop().then(()=>{
                this.game.endMessage = 'win!'
                this.game.addStage(EndStage,'static').reset().render();
            });
        }
    }
    /**
     * Rendering Score and Lives info.
     */
    renderInfo(){
        var textYpos = this.game.gameBounds.bottom + ((this.game.height - this.game.gameBounds.bottom) / 2) - 30/2;
        this.game.ctx.font="14px Arial";
        this.game.ctx.fillStyle = '#000';
        var info = "Lives: " + this.game.lives;
        this.game.ctx.textAlign = "left";
        this.game.ctx.fillText(info, this.game.gameBounds.left + 20, textYpos);
        info = "Score: " + this.game.scores;
        this.game.ctx.textAlign = "right";
        this.game.ctx.fillText(info, this.game.gameBounds.right - 20, textYpos);
    }
}

export default PlayStage;
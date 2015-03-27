import Stage from './Stage';
import PlayStage from './PlayStage';
class EndStage extends Stage {
    constructor (game,type){
        super(game,type);
    }
    render(){
        this.clear();
        this.game.ctx.font="30px Open Sans";
        this.game.ctx.textBaseline="center";
        this.game.ctx.textAlign="center";
        this.game.ctx.fillText("You are " + this.game.endMessage, this.game.width / 2, this.game.height/2 - 40);
        this.game.ctx.font="16px Open Sans";
        this.game.ctx.fillText("You scored: "+this.game.scores, this.game.width / 2, this.game.height/2 );
        this.game.ctx.fillText("Press 'Space' to start a new game.", this.game.width / 2, this.game.height/2 + 20);
    }
    reset() {
        this.subscriptors.keyDown = this.game.keyDownStream.subscribe(this.keyDownHandler.bind(this),this.errorHandler);
        return this;
    }
    keyDownHandler(e) {
        if(e.which==32) {
            this.stop();
            this.game.addStage(PlayStage,'dynamic').reset().start();
        }
    }
}

export default EndStage;
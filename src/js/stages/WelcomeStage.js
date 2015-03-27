import Stage from './Stage';
import PlayStage from './PlayStage';
class WelcomeStage extends Stage {
    constructor (game,type){
        super(game,type);
        this.subscriptors.keyDown = game.keyDownStream.subscribe(this.keyDownHandler.bind(this),this.errorHandler);
    }
    render(){
        this.clear();
        this.game.ctx.textBaseline="center";
        this.game.ctx.textAlign="center";
        this.game.ctx.fillText("Space Invaders", this.game.width / 2, this.game.height/2 - 40);
        this.game.ctx.font="16px Open Sans";
        this.game.ctx.fillText("Press 'Space' to start.", this.game.width / 2, this.game.height/2);
    }
    keyDownHandler(e) {
        if(e.which==32) {
            this.game.addStage(PlayStage,'dynamic').start();
            this.stop();
        }
    }
}

export default WelcomeStage;
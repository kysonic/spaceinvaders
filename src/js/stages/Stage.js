class Stage {
    constructor(game,type){
        if(!game) console.error('You forgot send game object.');
        this.game = game;
        this.isStarted = false;
        this.subscriptors = {};
        // If stage has not dynamic type, it cannot be started.
        this.canBeStart = type==='dynamic';
        // Default stage properties
        this.game.ctx.font="30px Open Sans";
        this.game.ctx.fillStyle = '#00000';
    }
    /**
     * Start stage.
     */
    start(){
        if(!this.canBeStart) return console.error('Stage is not dynamically.');
        this.isStarted = true;
        this.loopSubscription = this.game.gameLoopStream.subscribe(this.render.bind(this),this.errorHandler.bind(this),this.onComplete.bind(this));
    }
    /**
     * Stop stage.
     */
    stop(){
        return new Promise((resolve,reject)=>{
            this.isStarted = false;
            if(this.loopSubscription && this.loopSubscription.dispose) this.loopSubscription.dispose();
            for(var key in this.subscriptors) {this.subscriptors[key].dispose();}
            resolve();
        });
    }
    /**
     * Default stage error handler.
     * @param err {Error} - Stage loop error.
     */
    errorHandler(err) {
        console.error(err);
    }
    /**
     * Clear canvas.
     */
    clear() {
        this.game.ctx.clearRect(0, 0, this.game.width, this.game.height);
    }
    //Interface section
    preRender(){}
    render(){}
    update(){}
    onComplete(){}
}

export default Stage;
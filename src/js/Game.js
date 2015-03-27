import Rx from 'Reactive-Extensions/RxJS/dist/rx.lite.min';
import WelcomeStage from './stages/WelcomeStage';
import Sounds from './Sounds';
/**
 * Game. In this class we initialize all state of the game.
 * Also it contains event streams and settings of game control.
 */
class Game {
    constructor(opts) {
        this.opts = opts;
        // Game properties
        this.lives = 3;
        this.scores = 0;
        this.level = 1;
        this.stages = {};
        // Load game sounds
        this.sounds = new Sounds().loadSound('shoot', './src/sounds/shoot.wav')
                                  .loadSound('bang', './src/sounds/bang.wav')
                                  .loadSound('explosion', './src/sounds/explosion.wav')
                                  .loadSound('kill', './src/sounds/kill.wav');
        // Setup basic event stream
        this.keyDownStream = Rx.Observable.fromEvent(document.body,'keydown').filter((e)=>-1!=opts.controls.indexOf(e.which)).map((e)=>{return {which:e.which,type:e.type}});
        this.gameLoopStream = Rx.Observable.timer(1,1000/this.opts.fps).timestamp();
    }

    /**
     * Initialize
     * @param gameCanvas - HTML Canvas tag, which placed on document body.
     * @returns {Game} - Instance
     */
    initialize(gameCanvas) {
        if(!gameCanvas) return console.error('Canvas is missing.');
        // Canvas dims
        gameCanvas.width = 800;
        gameCanvas.height = 600;
        // Save it like a game property
        this.width  = gameCanvas.width;
        this.height  = gameCanvas.height;
        // Save canvas and context
        this.gameCanvas = gameCanvas;
        this.ctx = gameCanvas.getContext('2d');
        // Game bounds
        this.gameBounds = {left: 0, right: 800,top: 0,bottom: 600};
        return this;
    }

    /**
     * Start up!
     */
    start() {
        // Reset
        this.lives = 3;
        // Start with welcome stage.
        this.currentStage = this.addStage(WelcomeStage,'static').render();
    }

    /**
     * Add stage in game stages stack. If the game already
     * contains a current stage then we do not add this stage.
     * @param stage {Stage} - stage for adding.
     * @param type {String} - ('static' | 'dynamic'). Static do not use gameLoop stream.
     */
    addStage(stage,type) {
        var name = stage.prototype.constructor.name;
        if(!this.stages[name]) {
            this.stages[name] = new stage(this,type);
        }
        return this.stages[name];
    }
}

export default new Game({
    fps: 60,
    // Fire, Left, Right Code
    controls: [32,37,39]
});
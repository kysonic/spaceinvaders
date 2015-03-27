class Sounds {
    constructor(){
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if(!this.audioContext) console.error('Sorry. Your browser is not support audio technology.');
        this.source = this.audioContext.createBufferSource();
        this.sounds = {};
    }

    /**
     * Load sound in sounds store.
     * @param name - name for a placing sound in store.
     * @param url - url for sound on server.
     */
    loadSound(name,url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = ()=>{
            var audioData = xhr.response;
            this.audioContext.decodeAudioData(audioData, (buffer)=>{this.sounds[name] = {buffer: buffer};},(e)=>"Error with decoding audio data" + e.err);
        }
        xhr.send();
        return this;
    }

    /**
     * Play sound.
     * @param name - name for finding sound in store.
     */
    playSound(name) {
        if(this.sounds[name] === undefined || this.sounds[name] === null) {
            return;
        }
        //  Create a sound source, set the buffer, connect to the speakers and
        var source = this.audioContext.createBufferSource();
        source.buffer = this.sounds[name].buffer;
        source.connect(this.audioContext.destination);
        source.start(0);
    };
}
export default Sounds;
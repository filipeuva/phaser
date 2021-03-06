/// <reference path="Cache.ts" />
/// <reference path="Cameras.ts" />
/// <reference path="Emitter.ts" />
/// <reference path="Group.ts" />
/// <reference path="Loader.ts" />
/// <reference path="Sound.ts" />
/// <reference path="Sprite.ts" />
/// <reference path="Stage.ts" />
/// <reference path="Time.ts" />
/// <reference path="GameMath.ts" />
/// <reference path="World.ts" />
/// <reference path="system/input/Input.ts" />
/// <reference path="system/RequestAnimationFrame.ts" />

/**
*   Phaser
*
*   v0.5 - April 12th 2013
*
*   A small and feature-packed 2D canvas game framework born from the firey pits of Flixel and Kiwi.
*
*   Richard Davey (@photonstorm)
*   Adam Saltsman (@ADAMATOMIC) (original Flixel code)
*
*   "If you want your children to be intelligent,  read them fairy tales."
*   "If you want them to be more intelligent, read them more fairy tales."
*                                                       -- Albert Einstein
*/

class Game {

    constructor(callbackContext, parent?:string = '', width?: number = 800, height?: number = 600, initCallback = null, createCallback = null, updateCallback = null, renderCallback = null) {

        this.callbackContext = callbackContext;
        this.onInitCallback = initCallback;
        this.onCreateCallback = createCallback;
        this.onUpdateCallback = updateCallback;
        this.onRenderCallback = renderCallback;

        if (document.readyState === 'complete' || document.readyState === 'interactive')
        {
            this.boot(parent, width, height);
        }
        else
        {
            document.addEventListener('DOMContentLoaded', () => this.boot(parent, width, height), false);
        }
    
    }

    private _raf: RequestAnimationFrame;
    private _maxAccumulation: number = 32;
    private _accumulator: number = 0;
    private _step: number = 0;
    private _loadComplete: bool = false;
    private _paused: bool = false;
    private _pendingState = null;

    public static VERSION: string = 'Phaser version 0.5';

    //  Event callbacks
    public callbackContext;
    public onInitCallback = null;
    public onCreateCallback = null;
    public onUpdateCallback = null;
    public onRenderCallback = null;
    public onPausedCallback = null;

    public camera: Camera; // quick reference to the default created camera, access the rest via .world
    public cache: Cache;
    public input: Input;
    public loader: Loader;
    public sound: SoundManager;
    public stage: Stage;
    public time: Time;
    public math: GameMath;
    public world: World;

    public isBooted: bool = false;

    private boot(parent:string, width: number, height: number) {

        if (!document.body)
        {
            window.setTimeout(() => this.boot(parent, width, height), 13);
        }
        else
        {
            this.stage = new Stage(this, parent, width, height);
            this.world = new World(this, width, height);
            this.sound = new SoundManager(this);
            this.cache = new Cache(this);
            this.loader = new Loader(this, this.loadComplete);
            this.time = new Time(this);
            this.input = new Input(this);
            this.math = new GameMath(this);

            this.framerate = 60;

            //  Display the default game screen?
            if (this.onInitCallback == null && this.onCreateCallback == null && this.onUpdateCallback == null && this.onRenderCallback == null && this._pendingState == null)
            {
                this.isBooted = false;
                this.stage.drawInitScreen();
            }
            else
            {
                this.isBooted = true;
                this._loadComplete = false;

                this._raf = new RequestAnimationFrame(this.loop, this);

                if (this._pendingState)
                {
                    this.switchState(this._pendingState, false, false);
                }
                else
                {
                    this.startState();
                }

            }

        }

    }

    private loadComplete() {

        //  Called when the loader has finished after init was run
        this._loadComplete = true;

    }

    private loop() {

        if (this._paused == true)
        {
            if (this.onPausedCallback !== null)
            {
                this.onPausedCallback.call(this.callbackContext);
            }

            return;

        }

        this.time.update();
        this.input.update();
        this.stage.update();

        this._accumulator += this.time.delta;

        if (this._accumulator > this._maxAccumulation)
        {
            this._accumulator = this._maxAccumulation;
        }

        while (this._accumulator >= this._step)
        {
            this.time.elapsed = this.time.timeScale * (this._step / 1000);
            this.world.update();
            this._accumulator = this._accumulator - this._step;
        }

        if (this._loadComplete && this.onUpdateCallback)
        {
            this.onUpdateCallback.call(this.callbackContext);
        }

        this.world.render();

        if (this._loadComplete && this.onRenderCallback)
        {
            this.onRenderCallback.call(this.callbackContext);
        }

    }

    private startState() {

        if (this.onInitCallback !== null)
        {
            this.onInitCallback.call(this.callbackContext);
        }
        else
        {
            //  No init? Then there was nothing to load either
            if (this.onCreateCallback !== null)
            {
                this.onCreateCallback.call(this.callbackContext);
            }

            this._loadComplete = true;
        }

    }

    public setCallbacks(initCallback = null, createCallback = null, updateCallback = null, renderCallback = null) {

        this.onInitCallback = initCallback;
        this.onCreateCallback = createCallback;
        this.onUpdateCallback = updateCallback;
        this.onRenderCallback = renderCallback;

    }

    public switchState(state, clearWorld: bool = true, clearCache:bool = false) {

        if (this.isBooted == false)
        {
            this._pendingState = state;
            return;
        }

        //  Prototype?
        if (typeof state === 'function')
        {
            state = new state(this);
        }

        //  Ok, have we got the right functions?
        if (state['create'] || state['update'])
        {
            this.callbackContext = state;

            this.onInitCallback = null;
            this.onCreateCallback = null;
            this.onUpdateCallback = null;
            this.onRenderCallback = null;
            this.onPausedCallback = null;

            //  Bingo, let's set them up
            if (state['init'])
            {
                this.onInitCallback = state['init'];
            }

            if (state['create'])
            {
                this.onCreateCallback = state['create'];
            }

            if (state['update'])
            {
                this.onUpdateCallback = state['update'];
            }

            if (state['render'])
            {
                this.onRenderCallback = state['render'];
            }

            if (state['paused'])
            {
                this.onPausedCallback = state['paused'];
            }

            if (clearWorld)
            {
                this.world.destroy();

                if (clearCache == true)
                {
                    this.cache.destroy();
                }
            }

            this._loadComplete = false;

            this.startState();
        }
        else
        {
            throw Error("Invalid State object given. Must contain at least a create or update function.");
            return;
        }

    }

    //  Nuke the whole game from orbit
    public destroy() {

        this.callbackContext = null;
        this.onInitCallback = null;
        this.onCreateCallback = null;
        this.onUpdateCallback = null;
        this.onRenderCallback = null;
        this.onPausedCallback = null;
        this.camera = null;
        this.cache = null;
        this.input = null;
        this.loader = null;
        this.sound = null;
        this.stage = null;
        this.time = null;
        this.math = null;
        this.world = null;
        this.isBooted = false;

    }

    public get pause(): bool {
        return this._paused;
    }

    public set pause(value:bool) {
        
        if (value == true && this._paused == false)
        {
            this._paused = true;
        }
        else if (value == false && this._paused == true)
        {
            this._paused = false;
            this.time.time = Date.now();
            this.input.reset();
        }

    }

    public get framerate(): number {
        return 1000 / this._step;
    }

    public set framerate(value: number) {

        this._step = 1000 / value;

        if (this._maxAccumulation < this._step)
        {
            this._maxAccumulation = this._step;
        }

    }

    //  Handy Proxy methods

    public createCamera(x: number, y: number, width: number, height: number): Camera {
        return this.world.createCamera(x, y, width, height);
    }

    public createSprite(x: number, y: number, key?: string = ''): Sprite {
        return this.world.createSprite(x, y, key);
    }

    public createGroup(MaxSize?: number = 0): Group {
        return this.world.createGroup(MaxSize);
    }

    public createParticle(): Particle {
        return this.world.createParticle();
    }

    public createEmitter(x?: number = 0, y?: number = 0, size?:number = 0): Emitter {
        return this.world.createEmitter(x, y, size);
    }

    public createTilemap(key:string, mapData:string, format:number, tileWidth?:number,tileHeight?:number): Tilemap {
        return this.world.createTilemap(key, mapData, format, tileWidth, tileHeight);
    }

    public collide(ObjectOrGroup1: Basic = null, ObjectOrGroup2: Basic = null, NotifyCallback = null): bool {
        return this.world.overlap(ObjectOrGroup1, ObjectOrGroup2, NotifyCallback, World.separate);
    }

}

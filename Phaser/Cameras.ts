/// <reference path="Game.ts" />
/// <reference path="GameMath.ts" />
/// <reference path="Rectangle.ts" />
/// <reference path="Point.ts" />
/// <reference path="system/Camera.ts" />

//  TODO: If the Camera is larger than the Stage size then the rotation offset isn't correct
//  TODO: Texture Repeat doesn't scroll, because it's part of the camera not the world, need to think about this more

class Cameras {

    constructor(game: Game, x: number, y: number, width: number, height: number) {

        this._game = game;

        this._cameras = [];

        this.current = this.addCamera(x, y, width, height);

    }

    private _game: Game;

    private _cameras: Camera[];

    public current: Camera;

    public getAll(): Camera[] {
        return this._cameras;
    }

    public update() {
        this._cameras.forEach((camera) => camera.update());
    }

    public render() {
        this._cameras.forEach((camera) => camera.render());
    }

    public addCamera(x: number, y: number, width: number, height: number): Camera {

        var newCam: Camera = new Camera(this._game, this._cameras.length, x, y, width, height);

        this._cameras.push(newCam);

        return newCam;

    }

    public removeCamera(id: number): bool {

        if (this._cameras[id])
        {
            if (this.current === this._cameras[id])
            {
                this.current = null;
            }

            this._cameras.splice(id, 1);

            return true;
        }
        else
        {
            return false;
        }

    }

    public destroy() {

        this._cameras.length = 0;

        this.current = this.addCamera(0, 0, this._game.stage.width, this._game.stage.height);

    }

}


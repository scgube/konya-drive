// controls.js - Giriş yönetimi (WASD / Ok Tuşları + Fare)
export class Controls {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.mouseSensitivity = 0.003;
        this.isPointerLocked = false;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
        this._onPointerLockChange = this._onPointerLockChange.bind(this);
        this._onClick = this._onClick.bind(this);

        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mousedown', this._onMouseDown);
        document.addEventListener('mouseup', this._onMouseUp);
        document.addEventListener('pointerlockchange', this._onPointerLockChange);
        document.addEventListener('click', this._onClick);
    }

    _onKeyDown(e) {
        this.keys[e.code] = true;
        // Prevent scrolling with arrow keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
            e.preventDefault();
        }
    }

    _onKeyUp(e) {
        this.keys[e.code] = false;
    }

    _onMouseMove(e) {
        if (this.isPointerLocked) {
            this.mouseX += e.movementX * this.mouseSensitivity;
            this.mouseY += e.movementY * this.mouseSensitivity;
            // Clamp vertical
            this.mouseY = Math.max(-1.2, Math.min(0.8, this.mouseY));
        }
    }

    _onMouseDown(e) {
        if (e.button === 0) {
            this.isMouseDown = true;
        }
    }

    _onMouseUp(e) {
        if (e.button === 0) {
            this.isMouseDown = false;
        }
    }

    _onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement !== null;
    }

    _onClick() {
        // Request pointer lock on click if not already locked
        if (!this.isPointerLocked && document.pointerLockElement === null) {
            try {
                document.body.requestPointerLock();
            } catch(e) {}
        }
    }

    getState() {
        return {
            forward: this.keys['KeyW'] || this.keys['ArrowUp'],
            backward: this.keys['KeyS'] || this.keys['ArrowDown'],
            left: this.keys['KeyA'] || this.keys['ArrowLeft'],
            right: this.keys['KeyD'] || this.keys['ArrowRight'],
            brake: this.keys['Space'],
            reset: this.keys['KeyR'],
            boost: this.keys['ShiftLeft'] || this.keys['ShiftRight']
        };
    }

    getMouseLook() {
        return {
            x: this.mouseX,
            y: this.mouseY,
            locked: this.isPointerLocked
        };
    }

    // Reset mouse look when game restarts
    resetMouseLook() {
        this.mouseX = 0;
        this.mouseY = -0.3; // Slight downward angle
    }

    dispose() {
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mousedown', this._onMouseDown);
        document.removeEventListener('mouseup', this._onMouseUp);
        document.removeEventListener('pointerlockchange', this._onPointerLockChange);
        document.removeEventListener('click', this._onClick);
    }
}

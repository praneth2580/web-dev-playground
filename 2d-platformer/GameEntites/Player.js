class Player {

    x = 0;
    y = 0;
    vx = 0;
    vy = 0;
    vxCap = 10;
    vyCap = 50;
    gravity = 0.5;
    jumpStrength = -10;
    onGround = false;
    friction = .4;
    width = 10;
    height = 20;
    state = 'normal';

    constructor(data) {
        Object.assign(this, data);
    }

    jump() {
        if (this.onGround) {
            this.vy = this.jumpStrength;
            this.onGround = false;
        }
    }

    addVelocityX(x) {
        this.vx += x;
    }

    update(viewport) {
        // Apply gravity
        if (!this.onGround) {
            this.vy += this.gravity;
        }

        if (Math.abs(this.vx) > this.vxCap) this.vx = this.vx > 0 ? this.vxCap : this.vxCap * -1;

        // Update position
        this.x += this.vx;
        this.y += this.vy;
        this.state = 'normal';

        if (this.x < 0) {
            this.x = 0;
            this.vx = 0;
            this.state = 'hurt';
        }
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
            this.state = 'hurt';
        }

        if (this.x > (viewport.width - this.width)) {
            this.x = viewport.width - this.width;
            this.vx = 0;
            this.state = 'hurt';
        }

        // Ground collision check (simple example)
        if (this.y > (viewport.height - this.height)) {
            this.vx = this.vx * this.friction;
            this.y = (viewport.height - this.height);
            this.vy = 0;
            this.onGround = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.state ? 'blue' : 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
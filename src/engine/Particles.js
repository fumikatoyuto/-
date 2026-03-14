class ParticleSystem {
    constructor() {
        this.particles = [];
        this.sparks = [];
    }

    emitExplosion(x, y, color) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: Math.random() * 0.05 + 0.02,
                color,
                size: Math.random() * 4 + 2
            });
        }
    }

    emitTrail(x, y, color) {
        this.sparks.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            life: 1.0,
            decay: 0.1,
            color,
            size: Math.random() * 3 + 1
        });
    }

    update(dt) {
        // Explosions
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        // Trails
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            let s = this.sparks[i];
            s.life -= s.decay;
            if (s.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.globalCompositeOperation = 'lighter';

        // Particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Sparks
        this.sparks.forEach(s => {
            ctx.fillStyle = s.color;
            ctx.globalAlpha = s.life;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
    }
}

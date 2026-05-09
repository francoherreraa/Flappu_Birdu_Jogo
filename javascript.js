class Escena extends Phaser.Scene {

    constructor(){         // Método Constructor de JavaScript
        super('Escena'); 
        this.velocidadInicial = -200;  // Llamada al Constructor Padre
    }

    preload() {
        resize();
        window.addEventListener('resize', resize, false);
        this.load.image('fondo', '../img/espacio.jpg');
        this.load.image('asteroides', '../img/asteroides.png');
        this.load.spritesheet('heroe', '../img/heroe.png', {
            frameWidth: 50,
            frameHeight: 50
        });

        this.sfx = new SFXManager(this)
        this.sfx.preload();
        
        this.load.image('death1', 'img/death1.png');
        this.load.image('death2', 'img/death2.png');
        this.load.image('death3', 'img/death3.png');

        this.load.image('pipe0', '../img/pipe0.png');
        this.load.image('pipeAbajo0', '../img/pipeAbajo0.png');
        this.load.image('pipeArriba0', '../img/pipeArriba0.png');

        this.load.image('pipe1', '../img/pipe1.png');
        this.load.image('pipeAbajo1', '../img/pipeAbajo1.png');
        this.load.image('pipeArriba1', '../img/pipeArriba1.png');

    }

    create() {
        this.velocidadColumnas = this.velocidadInicial;
        this.dificil = false;

        this.sfx.create();
        this.sfx.playFondo();

        this.input.once('pointerdown', () => {
        this.sfx.playFondo();
        });

        this.bg = this.add.tileSprite(480, 320, 960, 640, 'fondo').setScrollFactor(0).setDepth(0);
        this.asteroides = this.add.tileSprite(480, 320, 1000, 700, 'asteroides').setScrollFactor(0).setDepth(1);
        this.player = this.physics.add.sprite(50, 200, 'heroe').setDepth(3)

        this.textoDificultad = this.add.text(10, -190, 'Dificultad: fácil', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000000',      
            strokeThickness: 4     
        }).setOrigin(0, 0).setDepth(3);






        //-----------------------
        //-------PUNTUACION------
        //-----------------------
        this.puntuacion = 0;
        this.textoPuntuacion = this.add.text(700, -190, 'Distancia: 0', {
            fontFamily: 'Arial',
            fontSize: '32px',
            fill: '#fff',
            stroke: '#000000',      
            strokeThickness: 4  
        }).setOrigin(0, 0).setDepth(3);

        this.time.addEvent({
            delay: 100,
            callback: () => {
                this.puntuacion++;
                this.textoPuntuacion.setText('Distancia: '+this.puntuacion)
            },
            loop: true
        })








        this.time.delayedCall(10000, () => {
            this.dificil = true;
            this.textoDificultad.setText('Dificultad: difícil')
            
        });

        this.anims.create({
            key: 'volar',
            frames: this.anims.generateFrameNumbers('heroe', {
                start: 0,
                end: 1
            }),
            frameRate: 7,
            repeat: -1,
        });

        this.anims.create({
            key: 'saltar',
            frames: this.anims.generateFrameNumbers('heroe', {
                start: 2,
                end: 2
            }),
            frameRate: 7,
            repeat: 1,
        });

        this.anims.create({
        key: 'deathAnim',
        frames: [
            { key: 'death1' },
            { key: 'death2' },
            { key: 'death3' }
        ],
        frameRate: 9,
        repeat: 2
    });

        this.player.anims.play('volar');

        this.input.keyboard.on('keydown', (event) => {
            if (event.keyCode === 32) {
                this.saltar();
            }
        });

        this.input.on('pointerdown', () => this.saltar());

        this.time.delayedCall(1000, this.nuevaColumna, [], this);
        this.player.on('animationcomplete', this.animationComplete, this);

        this.physics.world.setBoundsCollision(true);

        this.physics.world.on('worldbounds', (body) => {
            this.morir()
        });

        this.player.setCollideWorldBounds(true);
        this.player.body.onWorldBounds = true;
    };

    saltar() {
        this.player.setVelocityY(-400);
        this.player.play('saltar');
    }

    animationComplete(animation, frame, sprite) {
        if (animation.key === 'saltar') {
            this.player.play('volar');
        }
    }



    //------COLUMNAS-----------
    nuevaColumna() {
        const columna = this.physics.add.group();
        const hueco = Math.floor(Math.random() * 5) + 1;
        const aleatorio = Math.floor(Math.random() * 2);

         const libres = this.dificil ? 2 : 3;

        for (let i = 0; i < 8; i++) {
            if (i < hueco || i > hueco + (libres - 1)) {
                let cubo;
                if (i == hueco - 1) {
                    cubo = columna.create(960, i * 100, `pipeArriba${aleatorio}`);
                } else if (i == hueco + libres) {
                    cubo = columna.create(960, i * 100, `pipeAbajo${aleatorio}`);
                } else {
                    cubo = columna.create(960, i * 100, `pipe${aleatorio}`);
                }
                cubo.body.allowGravity = false;
                cubo.setDepth(2)
            }
        }
        // aplicar velocidad progresiva
        columna.setVelocityX(this.velocidadColumnas);
        this.velocidadColumnas -= 30; 

        this.time.delayedCall(2000, this.nuevaColumna, [], this);
        this.physics.add.overlap(this.player, columna, this.morir, null, this);

        
    }

    morir() {
        this.physics.pause();
        this.player.setVelocity(0);

        this.input.keyboard.enabled = false;
        this.input.enabled = false;

        
        this.player.play('deathAnim');

        this.puntuacionFinal = this.puntuacion;

        this.sfx.playChoque();

        // tras un pequeño delay, cambiar a perderScene
        this.time.delayedCall(1000, () => {
            this.scene.start('perderScene', {puntuacion: this.puntuacionFinal});
        });
    }

    

    update() {
        this.bg.tilePositionX += 1;          // fondo lento
    this.asteroides.tilePositionX += 2;
    }
}







//--------------------
//-------SFX----------
//--------------------
class SFXManager {
    constructor(scene){
       if (SFXManager.instance){
        return SFXManager.instance
    }
    this.scene = scene;
    this.choqueSound = null;
    this.musicaFondo = null;
    SFXManager.instance = this;
    }

    preload(){
        this.scene.load.audio('choque', 'audio/choque.mp3');
        this.scene.load.audio('musicaFondo', 'audio/musicaFondo.mp3');

    }

    create(){
        this.choqueSound = this.scene.sound.add('choque');

        if(!this.musicaFondo){
            this.musicaFondo = this.scene.sound.add('musicaFondo', {loop: true, volume: 0.2})
        }
        
    }

    playChoque(){
        if(this.choqueSound) this.choqueSound.play()
    }

    playFondo(){
        if(this.musicaFondo && !this.musicaFondo.isPlaying){
            this.musicaFondo.play()
        }
    }

}













//----------------------
//------PERDER--------- 
//---------------------
class PerderEscena extends Phaser.Scene {
    constructor() {
        super({
            key: 'perderScene'
        });
    }

    preload() {
        this.load.image('perder', '../img/perder-juego.jpg');
    }


    init(data) {
        this.puntuacion = data.puntuacion || 0;
    }

    create() {
        
        this.add.image(480, 320, 'perder');
        

        this.add.text(480, 350, 'Distancia recorrida: ' + this.puntuacion, {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(480, 400, 'Haz click para reiniciar', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#00ff00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);



        this.input.keyboard.on('keydown', function (event) {
            if (event.keyCode === 32) {
                this.scene.volverAJugar();
            }
        });

        this.input.on('pointerdown', () => this.volverAJugar())
    }

    volverAJugar() {
        this.scene.start('Escena');
    }
}





function resize() {
    const canvas = document.querySelector("canvas");
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const windowRatio = windowWidth / windowHeight;
    const gameRatio = config.width / config.height;
    if (windowRatio < gameRatio) {
        canvas.style.width = `${windowWidth}px`;
        canvas.style.height = `${windowWidth / gameRatio}px`;
    } else {
        canvas.style.width = `${windowHeight * gameRatio}px`;
        canvas.style.height = `${windowHeight}px`;
    }
}

const config = {
    type: Phaser.AUTO,
    width: 960,
    height: 640,
    scene: [Escena, PerderEscena],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: 800
            }
        },
    },
};

new Phaser.Game(config);
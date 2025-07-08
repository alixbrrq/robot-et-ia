
/**
* Blocs personnalisés pour MaqueenPlusV2 by Planète Sciences Occitanie
*/


//% groups=['Instructions générales', 'Déplacement du robot', 'Détection de l'environnement', 'LEDs', 'Caméra IA']
//% weight=100 color=#0fbc11 icon="\uf085"
namespace Planete {

    //Motor selection enumeration
    export enum MyEnumMotor {
        //% block="à droite"
        LeftMotor,
        //% block="à gauche"
        RightMotor,
    };

    //Motor direction enumeration selection
    export enum MyEnumDir {
        //% block="en avant"
        Forward,
        //% block="en arrière"
        Backward
    };

    //Symbol selection
    export enum MySymbol {
        //%block="="
        Egal,
        //%block=">"
        Superieur,
        //%block="<"
        Inferieur,
    };

    //Line sensor selection
    export enum MyEnumLineSensor {
        //% block="L2"
        SensorL2,
        //% block="L1"
        SensorL1,
        //% block="M"
        SensorM,
        //% block="R1"
        SensorR1,
        //% block="R2"
        SensorR2,
    };

    //Detection selection
    export enum MyEnumDetection {
        //% block="détecte"
        Detect,
        //% block="ne détecte pas"
        NotDetect,
    };

    //LED light selection enumeration
    export enum MyEnumLed {
        //% block="le feu rouge gauche"
        LeftLed,
        //% block="le feu rouge droit"
        RightLed,
        //% block="tous les feux rouges"
        AllLed,
    };

    //LED light switch enumeration selection
    export enum MyEnumSwitch {
        //% block="Éteindre"
        Close,
        //% block="Allumer"
        Open,
    };

    /**
 * Well known colors for a NeoPixel strip
 */
    export enum NeoPixelColors {
        //% block=rouge
        Red = 0xFF0000,
        //% block=orange
        Orange = 0xFFA500,
        //% block=jaune
        Yellow = 0xFFFF00,
        //% block=vert
        Green = 0x00FF00,
        //% block=bleu
        Blue = 0x0000FF,
        //% block=indigo
        Indigo = 0x4b0082,
        //% block=violet
        Violet = 0x8a2be2,
        //% block=rose
        Purple = 0xFF00FF,
        //% block=blanc
        White = 0xFFFFFF,
        //% block=noir
        Black = 0x000000
    };

    export enum CarLightColors {
        //% block=rouge
        Red = 1,
        //% block=vert
        Green = 2,
        //% block=jaune
        Yellow = 3,
        //% block=bleu
        Blue = 4,
        //% block=rose
        Purple = 5,
        //% block=cyan
        Cyan = 6,
        //% block=blanc
        White = 7,
        //% block=noir
        Black = 0
    };



    //% block

    function mydelayUs(unit: number): void {
        let i
        while ((--unit) > 0) {
            for (i = 0; i < 1; i++) {
            }
        }
    }

    const I2CADDR = 0x10;
    const ADC0_REGISTER = 0X1E;
    const ADC1_REGISTER = 0X20;
    const ADC2_REGISTER = 0X22;
    const ADC3_REGISTER = 0X24;
    const ADC4_REGISTER = 0X26;
    const LEFT_LED_REGISTER = 0X0B;
    const RIGHT_LED_REGISTER = 0X0C;
    const LEFT_MOTOR_REGISTER = 0X00;
    const RIGHT_MOTOR_REGISTER = 0X02;
    const LINE_STATE_REGISTER = 0X1D;
    const VERSION_CNT_REGISTER = 0X32;
    const VERSION_DATA_REGISTER = 0X33;

    /**
     *  Initialisation contantes pour les LEDs
     */

    let neopixel_buf = pins.createBuffer(16 * 3);
    for (let i = 0; i < 16 * 3; i++) {
        neopixel_buf[i] = 0
    }
    let _brightness = 255;



    /**
     *  Initialiser le Maqueen 
     */

    //% weight=100
    //%block="Initialiser le Maqueen" group="Instructions générales"
    export function I2CInit(): void {
        let Version_v = 0;
        //V3 systemReset
        let allBuffer = pins.createBuffer(2);
        allBuffer[0] = 0x49;
        allBuffer[1] = 1;
        pins.i2cWriteBuffer(I2CADDR, allBuffer);
        basic.pause(100);//waiting  reset

        pins.i2cWriteNumber(I2CADDR, 0x32, NumberFormat.Int8LE);
        Version_v = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE);
        while (Version_v == 0) {
            basic.showLeds(`
                # . . . #
                . # . # .
                . . # . .
                . # . # .
                # . . . #
                `, 10)
            basic.pause(500)
            basic.clearScreen()
            pins.i2cWriteNumber(0x10, 0x32, NumberFormat.Int8LE);
            Version_v = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE);
        }
        basic.showLeds(`
                . . . . .
                . . . . #
                . . . # .
                # . # . .
                . # . . .
                `, 10)
        basic.pause(500)
        basic.clearScreen()
    }


    /**
     * Déplacement robot avant/arrière 
     * @param edir   Motor direction selection enumeration
     */

    //% block="Se déplacer %edir à la vitesse %speed" group="Déplacement du robot"
    //% weight=99
    export function controlMotorAvant(edir: MyEnumDir, speed: number): void {
        let allBuffer = pins.createBuffer(5);
        allBuffer[0] = LEFT_MOTOR_REGISTER;
        allBuffer[1] = edir;
        allBuffer[2] = speed;
        allBuffer[3] = edir;
        allBuffer[4] = speed;
        pins.i2cWriteBuffer(I2CADDR, allBuffer)
    }

    /**
     * Utiliser le détecteur Ultrasons
     */

    //% block="la distance en cm mesurée par le détecteur utrasons %symbol %valeur" group="Détection de l'environnement"
    //% weight=94

    export function readUltrasonic(symbol: MySymbol, valeur: number): boolean {
        let data, trig, echo, x;
        trig = DigitalPin.P13;
        echo = DigitalPin.P14;
        x = valeur;
        pins.digitalWritePin(trig, 1);
        mydelayUs(10);
        pins.digitalWritePin(trig, 0)
        data = pins.pulseIn(echo, PulseValue.High, 1000 * 58);
        if (data == 0) //repeat
        {
            pins.digitalWritePin(trig, 1);
            mydelayUs(10);
            pins.digitalWritePin(trig, 0);
            data = pins.pulseIn(echo, PulseValue.High, 1000 * 58)
        }
        //59.259 / ((331.5 + 0.6 * (float)(10)) * 100 / 1000000.0) // The ultrasonic velocity (cm/us) compensated by temperature
        data = data / 59.259;

        if (data <= 0)
            data = 0;
        if (data > 300)
            data = 300;
        data = Math.round(data);

        switch (symbol) {
            case MySymbol.Egal:
                return data == x;
                break;
            case MySymbol.Superieur:
                return data > x;
                break;
            case MySymbol.Inferieur:
                return data < x;
                break;
        }
    }



    /**
     * Stopper tous les moteurs
     */

    //% block="STOP Robot" group="Déplacement du robot"
    //% weight=98
    export function controlMotorStop(): void {
        let allBuffer = pins.createBuffer(5);
        allBuffer[0] = LEFT_MOTOR_REGISTER;
        allBuffer[1] = 0;
        allBuffer[2] = 0;
        allBuffer[3] = 0;
        allBuffer[4] = 0;
        pins.i2cWriteBuffer(I2CADDR, allBuffer)
    }


    /**
     * Faire tourner robot
     * @param emotor Motor selection enumeration
     */

    //% block="Tourner %emotor à la vitesse %speed" group="Déplacement du robot"
    //% weight=99
    export function TourneMotor(emotor: MyEnumMotor, speed: number): void {
        let edir = MyEnumDir.Forward;
        switch (emotor) {

            case MyEnumMotor.LeftMotor:
                let allBuffer = pins.createBuffer(5);
                allBuffer[0] = LEFT_MOTOR_REGISTER;
                allBuffer[1] = edir;
                allBuffer[2] = speed;
                allBuffer[3] = edir;
                allBuffer[4] = 0;
                pins.i2cWriteBuffer(I2CADDR, allBuffer)
                break;
            case MyEnumMotor.RightMotor:
                let allBuffer1 = pins.createBuffer(3);
                allBuffer1[0] = LEFT_MOTOR_REGISTER;
                allBuffer1[1] = edir;
                allBuffer1[2] = 0;
                allBuffer1[3] = edir;
                allBuffer1[4] = speed;
                pins.i2cWriteBuffer(I2CADDR, allBuffer1);
                break;
        }
    }


    /**
    * Durée d'action
    * @param duree durée pendant laquelle l'action précédente va être exécutée
    */

    //% block="pendant %duree millisecondes" group="Instructions générales"
    //% weight=99
    export function pause(duree: number): void {
        basic.pause(duree);
    }

    /**
     * Détection ou non de la ligne par le capteur de suivi
     * @param eline Select the inspection sensor enumeration
     */

    //% block="le capteur %eline %detection la ligne" group="Détection de l'environnement"
    //% weight=96
    export function detectionLineSensorState(eline: MyEnumLineSensor, detection: MyEnumDetection): boolean {
        pins.i2cWriteNumber(I2CADDR, LINE_STATE_REGISTER, NumberFormat.Int8LE);
        let data = pins.i2cReadNumber(I2CADDR, NumberFormat.Int8LE)
        let statesensor;
        let stateuser;
        switch (eline) {
            case MyEnumLineSensor.SensorL1:
                statesensor = (data & 0x08) == 0x08 ? 1 : 0;
                break;
            case MyEnumLineSensor.SensorM:
                statesensor = (data & 0x04) == 0x04 ? 1 : 0;
                break;
            case MyEnumLineSensor.SensorR1:
                statesensor = (data & 0x02) == 0x02 ? 1 : 0;
                break;
            case MyEnumLineSensor.SensorL2:
                statesensor = (data & 0x10) == 0X10 ? 1 : 0;
                break;
            default:
                statesensor = (data & 0x01) == 0x01 ? 1 : 0;
                break;
        }
        switch (detection) {
            case MyEnumDetection.Detect:
                stateuser = 1;
                break;
            case MyEnumDetection.NotDetect:
                stateuser = 0;
                break;
        }
        return statesensor == stateuser;
    }

    /**
     * Contrôle les LEDs rouges gauche et droit
     * @param eled LED lamp selection
     * @param eSwitch Control LED light on or off
     */

    //% block="%eSwitch %eled" group="LEDs"
    //% weight=97
    export function controlLED(eSwitch: MyEnumSwitch, eled: MyEnumLed): void {
        switch (eled) {
            case MyEnumLed.LeftLed:
                let leftLedControlBuffer = pins.createBuffer(2);
                leftLedControlBuffer[0] = LEFT_LED_REGISTER;
                leftLedControlBuffer[1] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, leftLedControlBuffer);
                break;
            case MyEnumLed.RightLed:
                let rightLedControlBuffer = pins.createBuffer(2);
                rightLedControlBuffer[0] = RIGHT_LED_REGISTER;
                rightLedControlBuffer[1] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, rightLedControlBuffer);
                break;
            default:
                let allLedControlBuffer = pins.createBuffer(3);
                allLedControlBuffer[0] = LEFT_LED_REGISTER;
                allLedControlBuffer[1] = eSwitch;
                allLedControlBuffer[2] = eSwitch;
                pins.i2cWriteBuffer(I2CADDR, allLedControlBuffer);
                break;
        }
    }

    /**
     * Set the brightness of RGB LED
     * @param brightness  , eg: 100
     */

    //% weight=70
    //% brightness.min=0 brightness.max=255
    //% block="Fixer la luminosité des LEDs à |%brightness" group="LEDs"
    export function setBrightness(brightness: number) {
        _brightness = brightness;
    }

    /**
     * Choisir la couleur des LEDs
     * @param rgb couleur
     */

    //% weight=60
    //% block="Allumer les LEDs en |%rgb=neopixel_colors" group="LEDs"
    export function showColor(rgb: number) {
        let pin = DigitalPin.P15;
        let r = (rgb >> 16) * (_brightness / 255);
        let g = ((rgb >> 8) & 0xFF) * (_brightness / 255);
        let b = ((rgb) & 0xFF) * (_brightness / 255);
        for (let i = 0; i < 16 * 3; i++) {
            if ((i % 3) == 0)
                neopixel_buf[i] = Math.round(g)
            if ((i % 3) == 1)
                neopixel_buf[i] = Math.round(r)
            if ((i % 3) == 2)
                neopixel_buf[i] = Math.round(b)
        }
        ws2812b.sendBuffer(neopixel_buf, pin)
    }

    /**
     * Choisir la couleur pour une LED spécifique
     * @param index  , eg: DigitalPin.P15
     */

    //% weight=60
    //% index.min=0 index.max=3
    //% pin.defl=DigitalPin.P15
    //% block="Allumer la LED numéro |%index en |%rgb=neopixel_colors" group="LEDs"
    export function setIndexColor(index: number, rgb: number) {
        let pin = DigitalPin.P15;
        let f = index;
        let t = index;
        let r = (rgb >> 16) * (_brightness / 255);
        let g = ((rgb >> 8) & 0xFF) * (_brightness / 255);
        let b = ((rgb) & 0xFF) * (_brightness / 255);

        if (index > 15) {
            if (((index >> 8) & 0xFF) == 0x02) {
                f = index >> 16;
                t = index & 0xff;
            } else {
                f = 0;
                t = -1;
            }
        }
        for (let i = f; i <= t; i++) {
            neopixel_buf[i * 3 + 0] = Math.round(g)
            neopixel_buf[i * 3 + 1] = Math.round(r)
            neopixel_buf[i * 3 + 2] = Math.round(b)
        }
        ws2812b.sendBuffer(neopixel_buf, pin)

    }

    /**
    * Turn off all RGB LEDs
    * eg: DigitalPin.P15
    */

    //% weight=40
    //% block="Éteindre les 4 LEDS" group="LEDs"
    export function ledBlank() {
        let pin = DigitalPin.P15;
        showColor(0)
    }

}


enum Content1 {
    //% block="X centre"
    xCenter = 1,
    //% block="Y centre"
    yCenter = 2,
    //% block="largeur"
    width = 3,
    //% block="hauteur"
    height = 4
};

enum Content2 {
    //% block="X début"
    xOrigin = 1,
    //% block="Y début"
    yOrigin = 2,
    //% block="X fin"
    xTarget = 3,
    //% block="Y fin"
    yTarget = 4
};

enum Content3 {
    //% block="ID"
    ID = 5,
    //% block="X centre"
    xCenter = 1,
    //% block="Y centre"
    yCenter = 2,
    //% block="largeur"
    width = 3,
    //% block="hauteur"
    height = 4
};

enum Content4 {
    //% block="ID"
    ID = 5,
    //% block="X début"
    xOrigin = 1,
    //% block="Y début"
    yOrigin = 2,
    //% block="X fin"
    xTarget = 3,
    //% block="Y fin"
    yTarget = 4
};

enum HUSKYLENSResultType_t {
    //%block="Le cadre"
    HUSKYLENSResultBlock = 1,
    //%block="La flèche"
    HUSKYLENSResultArrow = 2,
};

enum HUSKYLENSResultType_t_2 {
    //%block="cadres"
    HUSKYLENSResultBlock = 1,
    //%block="flèches"
    HUSKYLENSResultArrow = 2,
};

let FIRST = {
    first: -1,
    xCenter: -1,
    xOrigin: -1,
    protocolSize: -1,
    algorithmType: -1,
    requestID: -1,
};

enum protocolCommand {
    COMMAND_REQUEST = 0x20,
    COMMAND_REQUEST_BLOCKS = 0x21,
    COMMAND_REQUEST_ARROWS = 0x22,
    COMMAND_REQUEST_LEARNED = 0x23,
    COMMAND_REQUEST_BLOCKS_LEARNED = 0x24,
    COMMAND_REQUEST_ARROWS_LEARNED = 0x25,
    COMMAND_REQUEST_BY_ID = 0x26,
    COMMAND_REQUEST_BLOCKS_BY_ID = 0x27,
    COMMAND_REQUEST_ARROWS_BY_ID = 0x28,
    COMMAND_RETURN_INFO = 0x29,
    COMMAND_RETURN_BLOCK = 0x2A,
    COMMAND_RETURN_ARROW = 0x2B,
    COMMAND_REQUEST_KNOCK = 0x2C,
    COMMAND_REQUEST_ALGORITHM = 0x2D,
    COMMAND_RETURN_OK = 0x2E,
    COMMAND_REQUEST_LEARN = 0x2F,
    COMMAND_REQUEST_FORGET = 0x30,
    COMMAND_REQUEST_SENSOR = 0x31,

};

enum protocolAlgorithm {
    //%block="Reconnaissance faciale"
    ALGORITHM_FACE_RECOGNITION = 0,
    //%block="Suivi d'objet"
    ALGORITHM_OBJECT_TRACKING = 1,
    //%block="Reconnaissance d'object"
    ALGORITHM_OBJECT_RECOGNITION = 2,
    //%block="Suivi de ligne"
    ALGORITHM_LINE_TRACKING = 3,
    //%block="Reconnaissance de couleur"
    ALGORITHM_COLOR_RECOGNITION = 4,
    //%block="Reconnaissance d'étiquettes"
    ALGORITHM_TAG_RECOGNITION = 5,
    //%block="Classification d'objet"
    OBJECTCLASSIFICATION,
    //%block="Reconnaissance de QR code"
    QRRECOGMITION,
    //%block="Reconnaissance de code-barres"
    BARCODERECOGNITION,

};

//% weight=100  color=#e7660b icon="\uf083" 
//% groups=['Instructions générales', 'Autres', 'Affichage sur l'écran', 'Nombre', 'Conditions']
namespace Planete_camera_IA {

    let protocolPtr: number[][] = [[0], [0], [0], [0], [0], [0], [0], [0], [0], [0]]
    let Protocol_t: number[] = [0, 0, 0, 0, 0, 0]
    let i = 1;
    let FRAME_BUFFER_SIZE = 128
    let HEADER_0_INDEX = 0
    let HEADER_1_INDEX = 1
    let ADDRESS_INDEX = 2
    let CONTENT_SIZE_INDEX = 3
    let COMMAND_INDEX = 4
    let CONTENT_INDEX = 5
    let PROTOCOL_SIZE = 6
    let send_index = 0;
    let receive_index = 0;

    let COMMAND_REQUEST = 0x20;

    let receive_buffer: number[] = [];
    let send_buffer: number[] = [];
    let buffer: number[] = [];

    let send_fail = false;
    let receive_fail = false;
    let content_current = 0;
    let content_end = 0;
    let content_read_end = false;

    let command: number
    let content: number


    //% advanced=true shim=i2c::init
    function init(): void {
        return;
    }

    /**
     * HuskyLens init I2C until success
     */
    //%block="Initialisation de la caméra" group="Instructions générales"
    //% weight=90
    export function initI2c(): void {
        init();
        while (!readKnock());
    }

    /**
     * HuskyLens change mode algorithm until success.
     */
    //%block="Placer la caméra en mode %mode" group="Instructions générales"
    //% weight=85
    export function initMode(mode: protocolAlgorithm) {
        writeAlgorithm(mode, protocolCommand.COMMAND_REQUEST_ALGORITHM)
        while (!wait(protocolCommand.COMMAND_RETURN_OK));
    }
    /**
     * HuskyLens requests data and stores it in the result.
     */

    //% block="Enregistrer les données de la  caméra" group="Instructions générales"
    //% weight=80
    export function request(): void {
        protocolWriteCommand(protocolCommand.COMMAND_REQUEST)
        processReturn();
    }

    /**
      * Huskylens forget all learning data of the current algorithm
      */
    //%block="Oublier toutes les données apprises" group="Instructions générales"
    //% weight=75
    export function forgetLearn(): void {
        writeAlgorithm(0x47, 0X37)
        //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    }

    /**
    * The box or arrow HuskyLens got from result appears in screen?
    */
    //%block="%Ht apparaît à l'écran" group="Conditions"
    //% weight=70
    export function isAppear_s(Ht: HUSKYLENSResultType_t): boolean {
        switch (Ht) {
            case 1:
                return countBlocks_s() != 0 ? true : false;
            case 2:
                return countArrows_s() != 0 ? true : false;
            default:
                return false;
        }
    }

    /**
    * The ID Huskylens got from result has been learned before?
    * @param id to id ,eg: 1
    */
    //% block="L'ID %id est apprise par la caméra" group="Conditions"
    //% weight=68
    export function isLearned(id: number): boolean {
        let hk_x = countLearnedIDs();
        if (id <= hk_x) return true;
        return false;
    }
    /**
    * The box or arrow corresponding to ID obtained by HuskyLens from result appears in screen？
    * @param id to id ,eg: 1
    */
    //% block="%Ht correspondant à l'ID %id apparaît à l'écran" group="Conditions"
    //% weight=65
    export function isAppear(Ht: HUSKYLENSResultType_t, id: number): boolean {
        switch (Ht) {
            case 1:
                return countBlocks(id) != 0 ? true : false;
            case 2:
                return countArrows(id) != 0 ? true : false;
            default:
                return false;
        }
    }

    /**
    * HuskyLens get the parameter of the box corresponding to ID from result.
    * @param id to id ,eg: 1
    */
    //%block="$number1 du cadre de l'ID $id" group="Autres"
    //% weight=60
    export function readeBox(id: number, number1: Content1): number {
        let hk_y = cycle_block(id, 1);
        let hk_x
        if (countBlocks(id) != 0) {
            if (hk_y != null) {
                switch (number1) {
                    case 1:
                        hk_x = protocolPtr[hk_y][1]; break;
                    case 2:
                        hk_x = protocolPtr[hk_y][2]; break;
                    case 3:
                        hk_x = protocolPtr[hk_y][3]; break;
                    case 4:
                        hk_x = protocolPtr[hk_y][4]; break;
                }
            }
            else hk_x = -1;
        }
        else hk_x = -1;
        return hk_x;
    }
    /**
    * HuskyLens get the parameter of the arrow corresponding to ID from result.
    * @param id to id ,eg: 1
    */

    //%block="$number1 de la flèche de l'ID $id" group="Autres"
    //% weight=55
    export function readeArrow(id: number, number1: Content2): number {
        let hk_y = cycle_arrow(id, 1);
        let hk_x
        if (countArrows(id) != 0) {
            if (hk_y != null) {

                switch (number1) {
                    case 1:
                        hk_x = protocolPtr[hk_y][1]; break;
                    case 2:
                        hk_x = protocolPtr[hk_y][2]; break;
                    case 3:
                        hk_x = protocolPtr[hk_y][3]; break;
                    case 4:
                        hk_x = protocolPtr[hk_y][4]; break;
                    default:
                        hk_x = -1;
                }
            }
            else hk_x = -1;
        }
        else hk_x = -1;
        return hk_x;
    }

    /**
    * HuskyLens get the number of the learned ID from result.
    */
    //%block="Nombre total d'IDs appris" group="Nombre"
    //% weight=50
    export function getIds(): number {
        return Protocol_t[2];
    }

    /**
    * HuskyLens get the box or arrow total number from result.
    * 
    */
    //%block="Nombre total de %Ht" group="Nombre"
    //% weight=47
    export function getBox(Ht: HUSKYLENSResultType_t_2): number {
        switch (Ht) {
            case 1:
                return countBlocks_s();
            case 2:
                return countArrows_s();
            default:
                return 0;
        }
    }


    /**
    * Set ID name
    * @param id to id ,eg: 1
    * @param name to name ,eg: "DFRobot"
    */
    //%block="Nommer l'ID %id : %name" group="Affichage sur l'écran"
    //% weight=28
    export function writeName(id: number, name: string): void {
        //do{
        let newname = name;
        let buffer = husky_lens_protocol_write_begin(0x2f);
        send_buffer[send_index] = id;
        send_buffer[send_index + 1] = (newname.length + 1) * 2;
        send_index += 2;
        for (let i = 0; i < newname.length; i++) {
            send_buffer[send_index] = newname.charCodeAt(i);
            //serial.writeNumber(newname.charCodeAt(i))
            send_index++;
        }
        send_buffer[send_index] = 0;
        send_index += 1;
        let length = husky_lens_protocol_write_end();
        let Buffer = pins.createBufferFromArray(buffer);
        protocolWrite(Buffer);
        //}while(!wait(protocolCommand.COMMAND_RETURN_OK));
    }
    /**
    * Display characters on the screen
    * @param name to name ,eg: "DFRobot"
    * @param x to x ,eg: 150
    * @param y to y ,eg: 30
    */
    //%block="Afficher %name à la position x %x y %y sur l'écran" group="Affichage sur l'écran"
    //% weight=27
    //% x.min=0 x.max=319
    //% y.min=0 y.max=210
    export function writeOSD(name: string, x: number, y: number): void {
        //do{
        let buffer = husky_lens_protocol_write_begin(0x34);
        send_buffer[send_index] = name.length;
        if (x > 255) {
            send_buffer[send_index + 2] = (x % 255);
            send_buffer[send_index + 1] = 0xff;
        } else {
            send_buffer[send_index + 1] = 0;
            send_buffer[send_index + 2] = x;
        }
        send_buffer[send_index + 3] = y;
        send_index += 4;
        for (let i = 0; i < name.length; i++) {
            send_buffer[send_index] = name.charCodeAt(i);
            //serial.writeNumber(name.charCodeAt(i));
            send_index++;
        }
        let length = husky_lens_protocol_write_end();
        //serial.writeNumber(length)
        let Buffer = pins.createBufferFromArray(buffer);
        protocolWrite(Buffer);
        //}while(!wait(protocolCommand.COMMAND_RETURN_OK));
    }
    /**
    * HuskyLens clear characters in the screen
    */
    //%block="Effacer tous les textes à l'écran" group="Affichage sur l'écran"
    //% weight=26
    export function clearOSD(): void {
        writeAlgorithm(0x45, 0X35);
        //while(!wait(protocolCommand.COMMAND_RETURN_OK));
    }


    function validateCheckSum() {

        let stackSumIndex = receive_buffer[3] + CONTENT_INDEX;
        let hk_sum = 0;
        for (let i = 0; i < stackSumIndex; i++) {
            hk_sum += receive_buffer[i];
        }
        hk_sum = hk_sum & 0xff;

        return (hk_sum == receive_buffer[stackSumIndex]);
    }

    function husky_lens_protocol_write_end() {
        if (send_fail) { return 0; }
        if (send_index + 1 >= FRAME_BUFFER_SIZE) { return 0; }
        send_buffer[CONTENT_SIZE_INDEX] = send_index - CONTENT_INDEX;
        //serial.writeValue("618", send_buffer[CONTENT_SIZE_INDEX])
        let hk_sum = 0;
        for (let i = 0; i < send_index; i++) {
            hk_sum += send_buffer[i];
        }

        hk_sum = hk_sum & 0xff;
        send_buffer[send_index] = hk_sum;
        send_index++;
        return send_index;
    }

    function husky_lens_protocol_write_begin(command = 0) {
        send_fail = false;
        send_buffer[HEADER_0_INDEX] = 0x55;
        send_buffer[HEADER_1_INDEX] = 0xAA;
        send_buffer[ADDRESS_INDEX] = 0x11;
        //send_buffer[CONTENT_SIZE_INDEX] = datalen;
        send_buffer[COMMAND_INDEX] = command;
        send_index = CONTENT_INDEX;
        return send_buffer;
    }

    function protocolWrite(buffer: Buffer) {
        pins.i2cWriteBuffer(0x32, buffer, false);
        basic.pause(50)
    }

    function processReturn() {
        if (!wait(protocolCommand.COMMAND_RETURN_INFO)) return false;
        protocolReadFiveInt16(protocolCommand.COMMAND_RETURN_INFO);
        for (let i = 0; i < Protocol_t[1]; i++) {

            if (!wait()) return false;
            if (protocolReadFiveInt161(i, protocolCommand.COMMAND_RETURN_BLOCK)) continue;
            else if (protocolReadFiveInt161(i, protocolCommand.COMMAND_RETURN_ARROW)) continue;
            else return false;
        }
        return true;
    }

    function wait(command = 0) {
        timerBegin();
        while (!timerAvailable()) {
            if (protocolAvailable()) {
                if (command) {
                    if (husky_lens_protocol_read_begin(command)) {
                        //serial.writeNumber(0);
                        return true;
                    }
                }
                else {
                    return true;
                }
            } else {
                return false;
            }
        }
        return false;
    }

    function husky_lens_protocol_read_begin(command = 0) {
        if (command == receive_buffer[COMMAND_INDEX]) {
            content_current = CONTENT_INDEX;
            content_read_end = false;
            receive_fail = false;
            return true;
        }
        return false;
    }

    let timeOutDuration = 100;
    let timeOutTimer: number
    function timerBegin() {
        timeOutTimer = input.runningTime();
    }

    function timerAvailable() {
        return (input.runningTime() - timeOutTimer > timeOutDuration);
    }

    let m_i = 16
    function protocolAvailable() {
        let buf = pins.createBuffer(16)
        if (m_i == 16) {
            buf = pins.i2cReadBuffer(0x32, 16, false);
            m_i = 0;
        }
        for (let i = m_i; i < 16; i++) {
            if (husky_lens_protocol_receive(buf[i])) {
                m_i++;
                return true;
            }
            m_i++;
        }
        return false
    }

    function husky_lens_protocol_receive(data: number): boolean {
        switch (receive_index) {
            case HEADER_0_INDEX:
                if (data != 0x55) { receive_index = 0; return false; }
                receive_buffer[HEADER_0_INDEX] = 0x55;
                break;
            case HEADER_1_INDEX:
                if (data != 0xAA) { receive_index = 0; return false; }
                receive_buffer[HEADER_1_INDEX] = 0xAA;
                break;
            case ADDRESS_INDEX:
                receive_buffer[ADDRESS_INDEX] = data;
                break;
            case CONTENT_SIZE_INDEX:
                if (data >= FRAME_BUFFER_SIZE - PROTOCOL_SIZE) { receive_index = 0; return false; }
                receive_buffer[CONTENT_SIZE_INDEX] = data;
                break;
            default:
                receive_buffer[receive_index] = data;

                if (receive_index == receive_buffer[CONTENT_SIZE_INDEX] + CONTENT_INDEX) {
                    content_end = receive_index;
                    receive_index = 0;
                    return validateCheckSum();

                }
                break;
        }
        receive_index++;
        return false;
    }

    function husky_lens_protocol_write_int16(content = 0) {

        let x: number = ((content.toString()).length)
        if (send_index + x >= FRAME_BUFFER_SIZE) { send_fail = true; return; }
        send_buffer[send_index] = content & 0xff;
        send_buffer[send_index + 1] = (content >> 8) & 0xff;
        send_index += 2;
    }

    function protocolReadFiveInt16(command = 0) {
        if (husky_lens_protocol_read_begin(command)) {
            Protocol_t[0] = command;
            Protocol_t[1] = husky_lens_protocol_read_int16();
            Protocol_t[2] = husky_lens_protocol_read_int16();
            Protocol_t[3] = husky_lens_protocol_read_int16();
            Protocol_t[4] = husky_lens_protocol_read_int16();
            Protocol_t[5] = husky_lens_protocol_read_int16();
            husky_lens_protocol_read_end();
            return true;
        }
        else {
            return false;
        }
    }

    function protocolReadFiveInt161(i: number, command = 0) {
        if (husky_lens_protocol_read_begin(command)) {
            protocolPtr[i][0] = command;
            protocolPtr[i][1] = husky_lens_protocol_read_int16();
            protocolPtr[i][2] = husky_lens_protocol_read_int16();
            protocolPtr[i][3] = husky_lens_protocol_read_int16();
            protocolPtr[i][4] = husky_lens_protocol_read_int16();
            protocolPtr[i][5] = husky_lens_protocol_read_int16();
            husky_lens_protocol_read_end();
            return true;
        }
        else {
            return false;
        }
    }

    function husky_lens_protocol_read_int16() {
        if (content_current >= content_end || content_read_end) { receive_fail = true; return 0; }
        let result = receive_buffer[content_current + 1] << 8 | receive_buffer[content_current];
        content_current += 2
        return result;
    }

    function husky_lens_protocol_read_end() {
        if (receive_fail) {
            receive_fail = false;
            return false;
        }
        return content_current == content_end;
    }

    function countLearnedIDs() {
        return Protocol_t[2]
    }

    function countBlocks(ID: number) {
        let counter = 0;
        for (let i = 0; i < Protocol_t[1]; i++) {
            if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK && protocolPtr[i][5] == ID) counter++;
        }
        return counter;
    }

    function countBlocks_s() {
        let counter = 0;
        for (let i = 0; i < Protocol_t[1]; i++) {
            if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK) counter++;
        }
        //serial.writeNumber(counter)
        return counter;
    }

    function countArrows(ID: number) {
        let counter = 0;
        for (let i = 0; i < Protocol_t[1]; i++) {
            if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW && protocolPtr[i][5] == ID) counter++;
        }
        return counter;
    }

    function countArrows_s() {
        let counter = 0;
        for (let i = 0; i < Protocol_t[1]; i++) {
            if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW) counter++;
        }
        return counter;
    }

    function readKnock() {
        for (let i = 0; i < 5; i++) {
            protocolWriteCommand(protocolCommand.COMMAND_REQUEST_KNOCK);//I2C
            if (wait(protocolCommand.COMMAND_RETURN_OK)) {
                return true;
            }
        }
        return false;
    }

    function writeForget() {
        for (let i = 0; i < 5; i++) {
            protocolWriteCommand(protocolCommand.COMMAND_REQUEST_FORGET);
            if (wait(protocolCommand.COMMAND_RETURN_OK)) {
                return true;
            }
        }
        return false;
    }

    function protocolWriteCommand(command = 0) {
        Protocol_t[0] = command;
        let buffer = husky_lens_protocol_write_begin(Protocol_t[0]);
        let length = husky_lens_protocol_write_end();
        let Buffer = pins.createBufferFromArray(buffer);
        protocolWrite(Buffer);
    }

    function protocolReadCommand(command = 0) {
        if (husky_lens_protocol_read_begin(command)) {
            Protocol_t[0] = command;
            husky_lens_protocol_read_end();
            return true;
        }
        else {
            return false;
        }
    }

    function writeAlgorithm(algorithmType: number, comemand = 0) {
        protocolWriteOneInt16(algorithmType, comemand);
        //return true//wait(protocolCommand.COMMAND_RETURN_OK);
        //while(!wait(protocolCommand.COMMAND_RETURN_OK));
        //return true
    }

    function writeLearn(algorithmType: number) {
        protocolWriteOneInt16(algorithmType, protocolCommand.COMMAND_REQUEST_LEARN);
        return wait(protocolCommand.COMMAND_RETURN_OK);
    }

    function protocolWriteOneInt16(algorithmType: number, command = 0) {
        let buffer = husky_lens_protocol_write_begin(command);
        husky_lens_protocol_write_int16(algorithmType);
        let length = husky_lens_protocol_write_end();
        let Buffer = pins.createBufferFromArray(buffer);
        protocolWrite(Buffer);
    }

    function cycle_block(ID: number, index = 1): number {
        let counter = 0;
        for (let i = 0; i < Protocol_t[1]; i++) {
            if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK && protocolPtr[i][5] == ID) {
                counter++;
                if (index == counter) return i;

            }
        }
        return null;
    }

    function cycle_arrow(ID: number, index = 1): number {
        let counter = 0;
        for (let i = 0; i < Protocol_t[1]; i++) {
            if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW && protocolPtr[i][5] == ID) {
                counter++;
                if (index == counter) return i;

            }
        }
        return null;
    }

    function readBlockCenterParameterDirect(): number {
        let distanceMinIndex = -1;
        let distanceMin = 65535;
        for (let i = 0; i < Protocol_t[1]; i++) {
            if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_BLOCK) {
                let distance = Math.round(Math.sqrt(Math.abs(protocolPtr[i][1] - 320 / 2))) + Math.round(Math.sqrt(Math.abs(protocolPtr[i][2] - 240 / 2)));
                if (distance < distanceMin) {
                    distanceMin = distance;
                    distanceMinIndex = i;
                }
            }
        }
        return distanceMinIndex
    }

    function readArrowCenterParameterDirect(): number {
        let distanceMinIndex = -1;
        let distanceMin = 65535;
        for (let i = 0; i < Protocol_t[1]; i++) {
            if (protocolPtr[i][0] == protocolCommand.COMMAND_RETURN_ARROW) {
                let distance = Math.round(Math.sqrt(Math.abs(protocolPtr[i][1] - 320 / 2))) + Math.round(Math.sqrt(Math.abs(protocolPtr[i][2] - 240 / 2)));
                if (distance < distanceMin) {
                    distanceMin = distance;
                    distanceMinIndex = i;
                }
            }
        }
        return distanceMinIndex
    }

    function no(): void {
        basic.showIcon(IconNames.No);
        basic.pause(100);
        basic.clearScreen();
        basic.pause(100);
    }
    function yes(): void {
        basic.showIcon(IconNames.Yes);
        basic.pause(100);
        basic.clearScreen();
    }


}
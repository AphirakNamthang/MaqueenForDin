// Custom MakeCode blocks for DFRobot Maqueen.

enum MaqueenMotor {
    //% block="ซ้าย"
    Left = 0,
    //% block="ขวา"
    Right = 2,
    //% block="ทั้งสอง"
    Both = 3
}

enum MaqueenDirection {
    //% block="เดินหน้า"
    Forward = 0,
    //% block="ถอยหลัง"
    Backward = 1
}

enum MaqueenLineSensor {
    //% block="ซ้าย"
    Left = 0,
    //% block="ขวา"
    Right = 1
}

enum MaqueenLinePosition {
    //% block="พื้นขาวหรือไม่เจอเส้น"
    None = 0,
    //% block="เส้นอยู่ซ้าย"
    Left = 1,
    //% block="เส้นอยู่ขวา"
    Right = 2,
    //% block="จุดนับก้าว"
    Checkpoint = 3
}

enum MaqueenTurnSide {
    //% block="ซ้าย"
    Left = 0,
    //% block="ขวา"
    Right = 1
}

enum MaqueenTurnAngle {
    //% block="90 องศา"
    Degree90 = 90,
    //% block="180 องศา"
    Degree180 = 180
}

/**
 * Blocks for Maqueen line following and checkpoint counting.
 */
//% weight=100 color=#0f8f6f icon="\uf1b9" block="Maqueen ของน้องดิน"
//% groups=["เดินตามเส้น", "เลี้ยว", "เซนเซอร์", "มอเตอร์", "ตั้งค่า"]
namespace maqueenStep {
    const I2C_ADDR = 0x10
    const LEFT_SENSOR = DigitalPin.P13
    const RIGHT_SENSOR = DigitalPin.P14

    let blackValue = 0
    let turn90Ms = 420

    function clampSpeed(speed: number): number {
        return Math.max(0, Math.min(255, speed))
    }

    function writeMotor(motor: MaqueenMotor, direction: MaqueenDirection, speed: number): void {
        const command = (motor << 12) | (direction << 8) | clampSpeed(speed)
        pins.i2cWriteNumber(I2C_ADDR, command, NumberFormat.UInt16BE)
    }

    function isBlackPin(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == blackValue
    }

    function checkpointDetected(): boolean {
        return isBlackPin(LEFT_SENSOR) && isBlackPin(RIGHT_SENSOR)
    }

    function sensorPin(sensor: MaqueenLineSensor): AnalogPin {
        if (sensor == MaqueenLineSensor.Left) {
            return <AnalogPin><number>DigitalPin.P13
        }
        return <AnalogPin><number>DigitalPin.P14
    }

    function analogSensorValue(sensor: MaqueenLineSensor): number {
        return pins.analogReadPin(sensorPin(sensor))
    }

    function rotate(side: MaqueenTurnSide, speed: number): void {
        if (side == MaqueenTurnSide.Left) {
            motorRun(MaqueenMotor.Left, MaqueenDirection.Backward, speed)
            motorRun(MaqueenMotor.Right, MaqueenDirection.Forward, speed)
        } else {
            motorRun(MaqueenMotor.Left, MaqueenDirection.Forward, speed)
            motorRun(MaqueenMotor.Right, MaqueenDirection.Backward, speed)
        }
    }

    /**
     * Set the digital value that means the line sensor is on black.
     * Most Maqueen line sensors read 0 on black and 1 on white.
     */
    //% blockId=maqueen_step_set_black_value
    //% block="ตั้งค่าเซนเซอร์อ่านสีดำเป็น %value"
    //% value.min=0 value.max=1 value.defl=0
    //% group="ตั้งค่า"
    //% weight=92
    export function setBlackSensorValue(value: number): void {
        blackValue = value == 0 ? 0 : 1
    }

    /**
     * Read one Maqueen line sensor.
     */
    //% blockId=maqueen_step_read_line_sensor
    //% block="เซนเซอร์เส้น %sensor เจอสีดำ"
    //% group="เซนเซอร์"
    //% weight=85
    export function lineSensorSeesBlack(sensor: MaqueenLineSensor): boolean {
        if (sensor == MaqueenLineSensor.Left) {
            return isBlackPin(LEFT_SENSOR)
        }
        return isBlackPin(RIGHT_SENSOR)
    }

    /**
     * Read the current line position from the left and right sensors.
     */
    //% blockId=maqueen_step_line_position
    //% block="ตำแหน่งเส้น"
    //% group="เซนเซอร์"
    //% weight=80
    export function linePosition(): MaqueenLinePosition {
        const left = isBlackPin(LEFT_SENSOR)
        const right = isBlackPin(RIGHT_SENSOR)

        if (left && right) {
            return MaqueenLinePosition.Checkpoint
        } else if (left) {
            return MaqueenLinePosition.Left
        } else if (right) {
            return MaqueenLinePosition.Right
        }

        return MaqueenLinePosition.None
    }

    /**
     * Detect a black line intersection checkpoint.
     * A checkpoint is detected when both left and right line sensors see black at the same time.
     */
    //% blockId=maqueen_step_black_intersection_detected
    //% block="เจอจุดตัดเส้นดำ"
    //% group="เซนเซอร์"
    //% weight=78
    export function seesBlackIntersection(): boolean {
        return checkpointDetected()
    }

    /**
     * Read the analog value of a Maqueen line sensor.
     * If the Maqueen model only has digital line sensors, this value may act like low/high instead of a smooth color value.
     */
    //% blockId=maqueen_step_line_sensor_analog
    //% block="ค่า analog เซนเซอร์เส้น %sensor"
    //% group="เซนเซอร์"
    //% weight=77
    export function lineSensorAnalog(sensor: MaqueenLineSensor): number {
        return analogSensorValue(sensor)
    }

    /**
     * Run one or both Maqueen motors.
     */
    //% blockId=maqueen_step_motor_run
    //% block="มอเตอร์ %motor วิ่ง %direction ความเร็ว %speed"
    //% speed.min=0 speed.max=255 speed.defl=80
    //% group="มอเตอร์"
    //% weight=75
    export function motorRun(motor: MaqueenMotor, direction: MaqueenDirection, speed: number): void {
        if (motor == MaqueenMotor.Both) {
            writeMotor(MaqueenMotor.Left, direction, speed)
            writeMotor(MaqueenMotor.Right, direction, speed)
        } else {
            writeMotor(motor, direction, speed)
        }
    }

    /**
     * Stop one or both Maqueen motors.
     */
    //% blockId=maqueen_step_motor_stop
    //% block="หยุดมอเตอร์ %motor"
    //% group="มอเตอร์"
    //% weight=70
    export function motorStop(motor: MaqueenMotor): void {
        motorRun(motor, MaqueenDirection.Forward, 0)
    }

    /**
     * Stop both Maqueen motors.
     */
    //% blockId=maqueen_step_stop_car
    //% block="หยุดรถ Maqueen"
    //% group="มอเตอร์"
    //% weight=72
    export function stopCar(): void {
        motorStop(MaqueenMotor.Both)
    }

    /**
     * Move Maqueen forward or backward for a number of seconds without following a line.
     */
    //% blockId=maqueen_step_drive_seconds
    //% block="รถวิ่ง %direction เป็นเวลา %seconds วินาที ความเร็ว %speed"
    //% seconds.min=0.1 seconds.max=30 seconds.defl=2
    //% speed.min=0 speed.max=255 speed.defl=80
    //% inlineInputMode=inline
    //% group="มอเตอร์"
    //% weight=74
    export function driveSeconds(direction: MaqueenDirection, seconds: number, speed: number): void {
        motorRun(MaqueenMotor.Both, direction, speed)
        basic.pause(Math.max(0, seconds) * 1000)
        motorStop(MaqueenMotor.Both)
    }

    /**
     * Calibrate how long Maqueen should rotate for a 90 degree turn.
     */
    //% blockId=maqueen_step_set_turn_90_time
    //% block="ตั้งเวลาเลี้ยว 90 องศาเป็น %milliseconds ms"
    //% milliseconds.min=100 milliseconds.max=2000 milliseconds.defl=420
    //% group="ตั้งค่า"
    //% weight=68
    export function setTurn90Time(milliseconds: number): void {
        turn90Ms = Math.max(100, Math.floor(milliseconds))
    }

    /**
     * Turn Maqueen left or right by 90 or 180 degrees.
     */
    //% blockId=maqueen_step_turn_angle
    //% block="เลี้ยว %side %angle ความเร็ว %speed"
    //% speed.min=0 speed.max=255 speed.defl=70
    //% group="เลี้ยว"
    //% weight=67
    export function turn(side: MaqueenTurnSide, angle: MaqueenTurnAngle, speed: number): void {
        rotate(side, speed)
        basic.pause(angle == MaqueenTurnAngle.Degree180 ? turn90Ms * 2 : turn90Ms)
        motorStop(MaqueenMotor.Both)
        basic.pause(100)
    }

    /**
     * Follow a black line once. Put this block inside a forever loop.
     */
    //% blockId=maqueen_step_follow_line_once
    //% block="เดินตามเส้นดำ ความเร็ว %speed ความเร็วเลี้ยว %turnSpeed"
    //% speed.min=0 speed.max=255 speed.defl=80
    //% turnSpeed.min=0 turnSpeed.max=255 turnSpeed.defl=45
    //% inlineInputMode=inline
    //% group="เดินตามเส้น"
    //% weight=65
    export function followBlackLineOnce(speed: number, turnSpeed: number): void {
        const position = linePosition()

        if (position == MaqueenLinePosition.Left) {
            motorRun(MaqueenMotor.Left, MaqueenDirection.Forward, turnSpeed)
            motorRun(MaqueenMotor.Right, MaqueenDirection.Forward, speed)
        } else if (position == MaqueenLinePosition.Right) {
            motorRun(MaqueenMotor.Left, MaqueenDirection.Forward, speed)
            motorRun(MaqueenMotor.Right, MaqueenDirection.Forward, turnSpeed)
        } else {
            motorRun(MaqueenMotor.Both, MaqueenDirection.Forward, speed)
        }
    }

    /**
     * Follow a black line until the Maqueen crosses the requested number of black line intersections.
     * A checkpoint is counted when both line sensors see black at the same time.
     */
    //% blockId=maqueen_step_forward_steps
    //% block="เดินตามเส้นดำไปข้างหน้า %steps ก้าว (จุดตัด) ความเร็ว %speed ความเร็วเลี้ยว %turnSpeed"
    //% steps.min=1 steps.max=20 steps.defl=2
    //% speed.min=0 speed.max=255 speed.defl=80
    //% turnSpeed.min=0 turnSpeed.max=255 turnSpeed.defl=45
    //% inlineInputMode=inline
    //% group="เดินตามเส้น"
    //% weight=100
    export function followLineForwardSteps(steps: number, speed: number, turnSpeed: number): void {
        let count = 0
        let wasOnCheckpoint = false
        const target = Math.max(0, Math.floor(steps))

        while (count < target) {
            followBlackLineOnce(speed, turnSpeed)

            if (checkpointDetected()) {
                if (!wasOnCheckpoint) {
                    count += 1
                    wasOnCheckpoint = true
                    basic.pause(180)
                }
            } else {
                wasOnCheckpoint = false
            }

            basic.pause(10)
        }

        motorStop(MaqueenMotor.Both)
    }
}

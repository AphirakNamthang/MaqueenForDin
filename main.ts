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
    let turnSearchDelayMs = 200
    let turnSearchTimeoutMs = 3000
    let searchSide = MaqueenTurnSide.Left
    let searchSpeed = 35

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

    function pivotTurn(side: MaqueenTurnSide, speed: number): void {
        if (side == MaqueenTurnSide.Left) {
            motorStop(MaqueenMotor.Left)
            motorRun(MaqueenMotor.Right, MaqueenDirection.Forward, speed)
        } else {
            motorRun(MaqueenMotor.Left, MaqueenDirection.Forward, speed)
            motorStop(MaqueenMotor.Right)
        }
    }

    function searchLine(): void {
        rotate(searchSide, searchSpeed)
    }

    function turnTargetSensorSeesBlack(side: MaqueenTurnSide): boolean {
        if (side == MaqueenTurnSide.Left) {
            return isBlackPin(LEFT_SENSOR)
        }
        return isBlackPin(RIGHT_SENSOR)
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
     * Set how Maqueen searches for the line when both line sensors see white.
     */
    //% blockId=maqueen_step_set_search_line
    //% block="ตั้งค่าหาเส้น หมุน %side ความเร็ว %speed"
    //% speed.min=0 speed.max=255 speed.defl=35
    //% group="ตั้งค่า"
    //% weight=91
    export function setSearchLine(side: MaqueenTurnSide, speed: number): void {
        searchSide = side
        searchSpeed = clampSpeed(speed)
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
     * Check whether both line sensors see white or no black line.
     */
    //% blockId=maqueen_step_no_black_line
    //% block="ไม่เจอเส้นดำเลย"
    //% group="เซนเซอร์"
    //% weight=79
    export function noBlackLine(): boolean {
        return !isBlackPin(LEFT_SENSOR) && !isBlackPin(RIGHT_SENSOR)
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
     * Rotate slowly using the configured search direction and speed.
     */
    //% blockId=maqueen_step_search_line_once
    //% block="หมุนหาเส้น"
    //% group="มอเตอร์"
    //% weight=73
    export function searchLineOnce(): void {
        searchLine()
    }

    /**
     * Spin Maqueen left or right for a number of milliseconds without using line sensors.
     * A spin runs the left and right motors in opposite directions.
     */
    //% blockId=maqueen_step_spin_time
    //% block="หมุน %side เป็นเวลา %seconds วินาที ความเร็ว %speed"
    //% seconds.min=0 seconds.max=10 seconds.defl=0.42
    //% speed.min=0 speed.max=255 speed.defl=70
    //% inlineInputMode=inline
    //% group="มอเตอร์"
    //% weight=78
    export function spinTime(side: MaqueenTurnSide, seconds: number, speed: number): void {
        rotate(side, speed)
        basic.pause(Math.max(0, seconds) * 1000)
        motorStop(MaqueenMotor.Both)
        basic.pause(100)
    }

    /**
     * Spin Maqueen left or right for an estimated 90 or 180 degree turn by time only.
     * A spin runs the left and right motors in opposite directions.
     */
    //% blockId=maqueen_step_spin_angle_time
    //% block="หมุน %side %angle ความเร็ว %speed เวลา 90 องศา %turn90Milliseconds ms"
    //% speed.min=0 speed.max=255 speed.defl=70
    //% turn90Milliseconds.min=100 turn90Milliseconds.max=2000 turn90Milliseconds.defl=420
    //% inlineInputMode=inline
    //% group="มอเตอร์"
    //% weight=77
    export function spinAngleByTime(side: MaqueenTurnSide, angle: MaqueenTurnAngle, speed: number, turn90Milliseconds: number): void {
        const duration = angle == MaqueenTurnAngle.Degree180 ? turn90Milliseconds * 2 : turn90Milliseconds
        spinTime(side, duration / 1000, speed)
    }

    /**
     * Turn Maqueen left or right for a number of milliseconds without using line sensors.
     * A turn stops one motor and runs the other motor.
     */
    //% blockId=maqueen_step_turn_time
    //% block="เลี้ยวแบบเวลา %side เป็นเวลา %seconds วินาที ความเร็ว %speed"
    //% seconds.min=0 seconds.max=10 seconds.defl=0.42
    //% speed.min=0 speed.max=255 speed.defl=70
    //% inlineInputMode=inline
    //% group="เลี้ยว"
    //% weight=65
    export function turnTime(side: MaqueenTurnSide, seconds: number, speed: number): void {
        pivotTurn(side, speed)
        basic.pause(Math.max(0, seconds) * 1000)
        motorStop(MaqueenMotor.Both)
        basic.pause(100)
    }

    /**
     * Turn Maqueen left or right for an estimated 90 or 180 degree turn by time only.
     * A turn stops one motor and runs the other motor.
     */
    //% blockId=maqueen_step_turn_angle_time blockHidden=true
    export function turnAngleByTime(side: MaqueenTurnSide, angle: MaqueenTurnAngle, speed: number, turn90Milliseconds: number): void {
        const duration = angle == MaqueenTurnAngle.Degree180 ? turn90Milliseconds * 2 : turn90Milliseconds
        turnTime(side, duration / 1000, speed)
    }

    /**
     * Rotate Maqueen left or right for a number of milliseconds without using line sensors.
     * A rotation runs the left and right motors in opposite directions.
     */
    //% blockId=maqueen_step_rotate_time blockHidden=true
    export function rotateTime(side: MaqueenTurnSide, milliseconds: number, speed: number): void {
        rotate(side, speed)
        basic.pause(Math.max(0, milliseconds))
        motorStop(MaqueenMotor.Both)
        basic.pause(100)
    }

    /**
     * Rotate Maqueen left or right for an estimated 90 or 180 degree turn by time only.
     * A rotation runs the left and right motors in opposite directions.
     */
    //% blockId=maqueen_step_rotate_angle_time blockHidden=true
    export function rotateAngleByTime(side: MaqueenTurnSide, angle: MaqueenTurnAngle, speed: number, turn90Milliseconds: number): void {
        const duration = angle == MaqueenTurnAngle.Degree180 ? turn90Milliseconds * 2 : turn90Milliseconds
        rotateTime(side, duration, speed)
    }

    /**
     * Turn left by time only without using line sensors.
     */
    //% blockId=maqueen_step_turn_left_time blockHidden=true
    export function turnLeftTime(milliseconds: number, speed: number): void {
        turnTime(MaqueenTurnSide.Left, milliseconds / 1000, speed)
    }

    /**
     * Turn right by time only without using line sensors.
     */
    //% blockId=maqueen_step_turn_right_time blockHidden=true
    export function turnRightTime(milliseconds: number, speed: number): void {
        turnTime(MaqueenTurnSide.Right, milliseconds / 1000, speed)
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
     * Set how long Maqueen should rotate before it starts searching for the next black line.
     */
    //% blockId=maqueen_step_set_turn_search_delay
    //% block="ตั้งเวลาหน่วงก่อนหาเส้นตอนเลี้ยวเป็น %milliseconds ms"
    //% milliseconds.min=0 milliseconds.max=1000 milliseconds.defl=200
    //% group="ตั้งค่า"
    //% weight=68
    export function setTurnSearchDelay(milliseconds: number): void {
        turnSearchDelayMs = Math.max(0, Math.floor(milliseconds))
    }

    /**
     * Set the maximum time Maqueen may spend searching for a black line while turning.
     */
    //% blockId=maqueen_step_set_turn_search_timeout
    //% block="ตั้งเวลาหาเส้นตอนเลี้ยวสูงสุด %milliseconds ms"
    //% milliseconds.min=500 milliseconds.max=10000 milliseconds.defl=3000
    //% group="ตั้งค่า"
    //% weight=67
    export function setTurnSearchTimeout(milliseconds: number): void {
        turnSearchTimeoutMs = Math.max(500, Math.floor(milliseconds))
    }

    /**
     * Turn Maqueen left or right until the line sensor finds the next black line.
     * A turn stops one motor and runs the other motor.
     * For 90 degrees it stops on the first detected black line.
     * For 180 degrees it stops on the second detected black line.
     */
    //% blockId=maqueen_step_turn_angle
    //% block="เลี้ยว %side %angle ความเร็ว %speed"
    //% speed.min=0 speed.max=255 speed.defl=70
    //% group="เลี้ยว"
    //% weight=66
    export function turn(side: MaqueenTurnSide, angle: MaqueenTurnAngle, speed: number): void {
        const targetHits = angle == MaqueenTurnAngle.Degree180 ? 2 : 1
        let hits = 0
        let wasOnLine = false
        const startedAt = input.runningTime()

        pivotTurn(side, speed)
        basic.pause(turnSearchDelayMs)

        while (hits < targetHits && input.runningTime() - startedAt < turnSearchTimeoutMs) {
            pivotTurn(side, speed)

            if (turnTargetSensorSeesBlack(side)) {
                if (!wasOnLine) {
                    hits += 1
                    wasOnLine = true
                }
            } else {
                wasOnLine = false
            }

            basic.pause(10)
        }

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
        } else if (position == MaqueenLinePosition.Checkpoint) {
            motorRun(MaqueenMotor.Both, MaqueenDirection.Forward, speed)
        } else {
            searchLine()
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

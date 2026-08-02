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
    const ULTRASONIC_TRIG = DigitalPin.P1
    const ULTRASONIC_ECHO = DigitalPin.P2

    const BLACK_VALUE = 0
    let turnSearchDelayMs = 200
    let turnSearchTimeoutMs = 3000
    let checkpointDebounceMs = 500
    let obstacleDistanceCm = 10
    let configuredTurnSpeed = 70
    let configuredSpinSpeed = 70
    let spin90Ms = 1000
    let searchSide = MaqueenTurnSide.Left
    let searchSpeed = 35

    function clampSpeed(speed: number): number {
        return Math.max(0, Math.min(255, Math.floor(speed)))
    }

    function writeMotor(motor: MaqueenMotor, direction: MaqueenDirection, speed: number): void {
        const buf = pins.createBuffer(3)
        buf[0] = motor
        buf[1] = direction
        buf[2] = clampSpeed(speed)
        pins.i2cWriteBuffer(I2C_ADDR, buf)
    }

    function isBlackPin(pin: DigitalPin): boolean {
        return pins.digitalReadPin(pin) == BLACK_VALUE
    }

    function checkpointDetected(): boolean {
        return isBlackPin(LEFT_SENSOR) && isBlackPin(RIGHT_SENSOR)
    }

    function checkpointDebounceReady(lastDetectedAt: number): boolean {
        return input.runningTime() - lastDetectedAt >= checkpointDebounceMs
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
     * Hidden compatibility block. This extension fixes black sensor value to 1.
     */
    //% blockId=maqueen_step_set_black_value blockHidden=true
    export function setBlackSensorValue(value: number): void {
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
     * Set turn speed used by the simple turn block.
     */
    //% blockId=maqueen_step_set_turn_speed
    //% block="ตั้งค่าความเร็วเลี้ยวเป็น %speed"
    //% speed.min=0 speed.max=255 speed.defl=70
    //% group="ตั้งค่า"
    //% weight=90
    export function setTurnSpeed(speed: number): void {
        configuredTurnSpeed = clampSpeed(speed)
    }

    /**
     * Set spin speed used by the simple spin block.
     */
    //% blockId=maqueen_step_set_spin_speed
    //% block="ตั้งค่าความเร็วหมุนเป็น %speed"
    //% speed.min=0 speed.max=255 speed.defl=70
    //% group="ตั้งค่า"
    //% weight=89
    export function setSpinSpeed(speed: number): void {
        configuredSpinSpeed = clampSpeed(speed)
    }

    /**
     * Set how long Maqueen should spin for an estimated 90 degree turn.
     */
    //% blockId=maqueen_step_set_spin_90_seconds
    //% block="ตั้งเวลา 90 องศาตอนหมุนเป็น %seconds วินาที"
    //% seconds.min=1 seconds.max=10 seconds.defl=1
    //% group="ตั้งค่า"
    //% weight=88
    export function setSpin90Seconds(seconds: number): void {
        spin90Ms = Math.max(1, seconds) * 1000
    }

    /**
     * Set obstacle distance threshold for ultrasonic blocks.
     */
    //% blockId=maqueen_step_set_obstacle_distance
    //% block="ตั้งค่าระยะชนวัตถุเป็น %centimeters เซนติเมตร"
    //% centimeters.min=1 centimeters.max=200 centimeters.defl=10
    //% group="ตั้งค่า"
    //% weight=87
    export function setObstacleDistance(centimeters: number): void {
        obstacleDistanceCm = Math.max(1, Math.floor(centimeters))
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
     * Read ultrasonic distance in centimeters.
     */
    //% blockId=maqueen_step_ultrasonic_cm
    //% block="ระยะ Ultrasonic (เซนติเมตร)"
    //% group="เซนเซอร์"
    //% weight=76
    export function ultrasonicDistanceCm(): number {
        pins.setPull(ULTRASONIC_TRIG, PinPullMode.PullNone)
        pins.digitalWritePin(ULTRASONIC_TRIG, 0)
        control.waitMicros(2)
        pins.digitalWritePin(ULTRASONIC_TRIG, 1)
        control.waitMicros(10)
        pins.digitalWritePin(ULTRASONIC_TRIG, 0)

        const duration = pins.pulseIn(ULTRASONIC_ECHO, PulseValue.High, 25000)
        if (duration <= 0) {
            return 999
        }

        return Math.idiv(duration, 58)
    }

    /**
     * Check whether ultrasonic distance is within the configured obstacle threshold.
     */
    //% blockId=maqueen_step_obstacle_detected
    //% block="เจอวัตถุข้างหน้า"
    //% group="เซนเซอร์"
    //% weight=75
    export function obstacleDetected(): boolean {
        return ultrasonicDistanceCm() <= obstacleDistanceCm
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
    //% blockId=maqueen_step_spin_seconds blockHidden=true
    export function spinSeconds(side: MaqueenTurnSide, seconds: number, speed: number): void {
        rotate(side, speed)
        basic.pause(Math.max(1, seconds) * 1000)
        motorStop(MaqueenMotor.Both)
        basic.pause(100)
    }

    /**
     * Hidden compatibility block for the old millisecond spin block.
     */
    //% blockId=maqueen_step_spin_time blockHidden=true
    export function spinTime(side: MaqueenTurnSide, milliseconds: number, speed: number): void {
        spinSeconds(side, milliseconds / 1000, speed)
    }

    /**
     * Spin Maqueen left or right for an estimated 90 or 180 degree turn by time only.
     * A spin runs the left and right motors in opposite directions.
     */
    //% blockId=maqueen_step_spin_angle_v2 blockHidden=true
    export function spin(side: MaqueenTurnSide, angle: MaqueenTurnAngle): void {
        spinDirection(side, angle)
    }

    /**
     * Spin Maqueen left or right using configured spin speed and 90 degree time.
     */
    //% blockId=maqueen_step_spin_direction_angle
    //% block="หมุน %side %angle"
    //% group="มอเตอร์"
    //% weight=78
    export function spinDirection(side: MaqueenTurnSide, angle: MaqueenTurnAngle): void {
        const duration = angle == MaqueenTurnAngle.Degree180 ? spin90Ms * 2 : spin90Ms
        spinSeconds(side, duration / 1000, configuredSpinSpeed)
    }

    /**
     * Hidden compatibility block for the old timed spin angle block.
     */
    //% blockId=maqueen_step_spin_angle_time blockHidden=true
    export function spinAngleByTime(side: MaqueenTurnSide, angle: MaqueenTurnAngle, speed: number, turn90Milliseconds: number): void {
        const duration = angle == MaqueenTurnAngle.Degree180 ? turn90Milliseconds * 2 : turn90Milliseconds
        spinSeconds(side, duration / 1000, speed)
    }

    /**
     * Turn Maqueen left or right for a number of milliseconds without using line sensors.
     * A turn stops one motor and runs the other motor.
     */
    //% blockId=maqueen_step_turn_seconds
    //% block="เลี้ยวแบบเวลา %side เป็นเวลา %seconds วินาที ความเร็ว %speed"
    //% seconds.min=1 seconds.max=10 seconds.defl=1
    //% speed.min=0 speed.max=255 speed.defl=70
    //% inlineInputMode=inline
    //% group="เลี้ยว"
    //% weight=65
    export function turnSeconds(side: MaqueenTurnSide, seconds: number, speed: number): void {
        pivotTurn(side, speed)
        basic.pause(Math.max(1, seconds) * 1000)
        motorStop(MaqueenMotor.Both)
        basic.pause(100)
    }

    /**
     * Hidden compatibility block for the old millisecond turn block.
     */
    //% blockId=maqueen_step_turn_time blockHidden=true
    export function turnTime(side: MaqueenTurnSide, milliseconds: number, speed: number): void {
        turnSeconds(side, milliseconds / 1000, speed)
    }

    /**
     * Turn Maqueen left or right for an estimated 90 or 180 degree turn by time only.
     * A turn stops one motor and runs the other motor.
     */
    //% blockId=maqueen_step_turn_angle_time blockHidden=true
    export function turnAngleByTime(side: MaqueenTurnSide, angle: MaqueenTurnAngle, speed: number, turn90Milliseconds: number): void {
        const duration = angle == MaqueenTurnAngle.Degree180 ? turn90Milliseconds * 2 : turn90Milliseconds
        turnSeconds(side, duration / 1000, speed)
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
        turnSeconds(MaqueenTurnSide.Left, milliseconds / 1000, speed)
    }

    /**
     * Turn right by time only without using line sensors.
     */
    //% blockId=maqueen_step_turn_right_time blockHidden=true
    export function turnRightTime(milliseconds: number, speed: number): void {
        turnSeconds(MaqueenTurnSide.Right, milliseconds / 1000, speed)
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
     * Set how many seconds Maqueen should turn before it starts searching for the next black line.
     */
    //% blockId=maqueen_step_set_turn_search_delay_seconds_v2
    //% block="ตั้งเวลาหน่วงก่อนหาเส้นตอนเลี้ยวเป็น %seconds วินาที"
    //% seconds.min=1 seconds.max=10 seconds.defl=1
    //% group="ตั้งค่า"
    //% weight=68
    export function setTurnSearchDelaySecondValue(seconds: number): void {
        turnSearchDelayMs = Math.max(1, seconds) * 1000
    }

    /**
     * Hidden compatibility block for the first second-based turn-search delay setting.
     */
    //% blockId=maqueen_step_set_turn_search_delay_seconds blockHidden=true
    export function setTurnSearchDelaySeconds(seconds: number): void {
        setTurnSearchDelaySecondValue(seconds)
    }

    /**
     * Hidden compatibility block for the old millisecond turn-search delay setting.
     */
    //% blockId=maqueen_step_set_turn_search_delay blockHidden=true
    export function setTurnSearchDelay(milliseconds: number): void {
        turnSearchDelayMs = Math.max(0, Math.floor(milliseconds))
    }

    /**
     * Set the maximum seconds Maqueen may spend searching for a black line while turning.
     */
    //% blockId=maqueen_step_set_turn_search_timeout_seconds_v2
    //% block="ตั้งเวลาหาเส้นตอนเลี้ยวสูงสุด %seconds วินาที"
    //% seconds.min=1 seconds.max=10 seconds.defl=3
    //% group="ตั้งค่า"
    //% weight=67
    export function setTurnSearchTimeoutSecondValue(seconds: number): void {
        turnSearchTimeoutMs = Math.max(1, seconds) * 1000
    }

    /**
     * Hidden compatibility block for the first second-based turn-search timeout setting.
     */
    //% blockId=maqueen_step_set_turn_search_timeout_seconds blockHidden=true
    export function setTurnSearchTimeoutSeconds(seconds: number): void {
        setTurnSearchTimeoutSecondValue(seconds)
    }

    /**
     * Hidden compatibility block for the old millisecond turn-search timeout setting.
     */
    //% blockId=maqueen_step_set_turn_search_timeout blockHidden=true
    export function setTurnSearchTimeout(milliseconds: number): void {
        turnSearchTimeoutMs = Math.max(500, Math.floor(milliseconds))
    }

    /**
     * Set checkpoint debounce time in milliseconds.
     */
    //% blockId=maqueen_step_set_checkpoint_debounce
    //% block="ตั้งเวลา debounce จุดตัดเป็น %milliseconds ms"
    //% milliseconds.min=100 milliseconds.max=3000 milliseconds.defl=500
    //% group="ตั้งค่า"
    //% weight=66
    export function setCheckpointDebounce(milliseconds: number): void {
        checkpointDebounceMs = Math.max(0, Math.floor(milliseconds))
    }

    /**
     * Turn Maqueen left or right until the line sensor finds the next black line.
     * A turn stops one motor and runs the other motor.
     * For 90 degrees it stops on the first detected black line.
     * For 180 degrees it stops on the second detected black line.
     */
    //% blockId=maqueen_step_turn_angle_v2
    //% block="เลี้ยว %side %angle"
    //% group="เลี้ยว"
    //% weight=66
    export function turn(side: MaqueenTurnSide, angle: MaqueenTurnAngle): void {
        const targetHits = angle == MaqueenTurnAngle.Degree180 ? 2 : 1
        let hits = 0
        let wasOnLine = false
        const startedAt = input.runningTime()

        pivotTurn(side, configuredTurnSpeed)
        basic.pause(turnSearchDelayMs)

        while (hits < targetHits && input.runningTime() - startedAt < turnSearchTimeoutMs) {
            pivotTurn(side, configuredTurnSpeed)

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
     * Hidden compatibility block for the old turn block with speed input.
     */
    //% blockId=maqueen_step_turn_angle blockHidden=true
    export function turnWithSpeed(side: MaqueenTurnSide, angle: MaqueenTurnAngle, speed: number): void {
        setTurnSpeed(speed)
        turn(side, angle)
    }

    /**
     * Drive forward until Maqueen detects an obstacle, turn left or right, and repeat.
     * After the requested number of obstacle turns, stop both motors.
     */
    //% blockId=maqueen_step_obstacle_turn_count
    //% block="ชนวัตถุเลี้ยว %side %times ครั้ง ความเร็วเดินหน้า %driveSpeed"
    //% times.min=1 times.max=20 times.defl=1
    //% driveSpeed.min=0 driveSpeed.max=255 driveSpeed.defl=80
    //% group="มอเตอร์"
    //% weight=75
    export function obstacleTurnCount(side: MaqueenTurnSide, times: number, driveSpeed: number): void {
        let count = 0
        let wasNearObstacle = false
        const target = Math.max(0, Math.floor(times))

        while (count < target) {
            motorRun(MaqueenMotor.Both, MaqueenDirection.Forward, driveSpeed)

            if (obstacleDetected()) {
                if (!wasNearObstacle) {
                    count += 1
                    wasNearObstacle = true
                    motorStop(MaqueenMotor.Both)
                    basic.pause(200)
                    turn(side, MaqueenTurnAngle.Degree90)
                    basic.pause(300)
                }
            } else {
                wasNearObstacle = false
            }

            basic.pause(50)
        }

        motorStop(MaqueenMotor.Both)
    }

    /**
     * Drive forward until Maqueen detects an obstacle, spin left or right, and repeat.
     * After the requested number of obstacle spins, stop both motors.
     */
    //% blockId=maqueen_step_obstacle_spin_count
    //% block="ชนวัตถุหมุน %side %times ครั้ง ความเร็วเดินหน้า %driveSpeed"
    //% times.min=1 times.max=20 times.defl=1
    //% driveSpeed.min=0 driveSpeed.max=255 driveSpeed.defl=80
    //% group="มอเตอร์"
    //% weight=74
    export function obstacleSpinCount(side: MaqueenTurnSide, times: number, driveSpeed: number): void {
        let count = 0
        let wasNearObstacle = false
        const target = Math.max(0, Math.floor(times))

        while (count < target) {
            motorRun(MaqueenMotor.Both, MaqueenDirection.Forward, driveSpeed)

            if (obstacleDetected()) {
                if (!wasNearObstacle) {
                    count += 1
                    wasNearObstacle = true
                    motorStop(MaqueenMotor.Both)
                    basic.pause(200)
                    spinDirection(side, MaqueenTurnAngle.Degree90)
                    basic.pause(300)
                }
            } else {
                wasNearObstacle = false
            }

            basic.pause(50)
        }

        motorStop(MaqueenMotor.Both)
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
        let lastCheckpointAt = -checkpointDebounceMs
        const target = Math.max(0, Math.floor(steps))

        while (count < target) {
            followBlackLineOnce(speed, turnSpeed)

            if (checkpointDetected()) {
                if (!wasOnCheckpoint && checkpointDebounceReady(lastCheckpointAt)) {
                    count += 1
                    lastCheckpointAt = input.runningTime()
                    wasOnCheckpoint = true
                    basic.pause(80)
                }
            } else {
                wasOnCheckpoint = false
            }

            basic.pause(10)
        }

        motorStop(MaqueenMotor.Both)
    }
}
